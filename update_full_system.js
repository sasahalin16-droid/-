const fs = require('fs');
const path = require('path');

console.log('📧 Настройка системы уведомлений и записи...');

// 1. ОБНОВЛЯЕМ МОДЕЛЬ ЗАПИСИ (Добавляем email)
const appointmentModel = `
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AppSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    email: String, // Новое поле
    service: String,
    status: { type: String, default: 'new' }, // new, confirmed, done, canceled
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppSchema);
`;
fs.writeFileSync(path.join('models', 'Appointment.js'), appointmentModel);
console.log('✅ Модель Appointment обновлена (добавлен Email).');


// 2. СОЗДАЕМ УТИЛИТУ ОТПРАВКИ ПИСЕМ (utils/mailer.js)
if (!fs.existsSync('utils')) fs.mkdirSync('utils');

const mailerCode = `
const nodemailer = require('nodemailer');

// 👇👇👇 ВСТАВЬ СВОИ ДАННЫЕ СЮДА 👇👇👇
const transporter = nodemailer.createTransport({
    service: 'gmail', // Или 'yandex', 'mail.ru'
    auth: {
        user: 'tvoj_email@gmail.com', // Твоя почта
        pass: 'tvoj_parol_prilozheniya' // Пароль приложений (App Password)
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        if (!to) return;
        
        // Если пароль не настроен, просто пишем в консоль (чтобы сайт не падал)
        if (transporter.options.auth.pass === 'tvoj_parol_prilozheniya') {
            console.log('📨 [EMAIL MOCK] To:', to);
            console.log('Subject:', subject);
            return;
        }

        await transporter.sendMail({
            from: '"Белая Роза" <noreply@belayaroza.ru>',
            to,
            subject,
            html
        });
        console.log('✅ Письмо отправлено на ' + to);
    } catch (e) {
        console.error('Ошибка отправки почты:', e.message);
    }
};

module.exports = sendEmail;
`;
fs.writeFileSync(path.join('utils', 'mailer.js'), mailerCode);
console.log('✅ Почтовый сервис создан (utils/mailer.js).');


// 3. ОБНОВЛЯЕМ РОУТЫ (Чтобы отправлять письма)

// INDEX ROUTE (Создание записи)
const indexRoute = `
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const sendEmail = require('../utils/mailer');

const protect = (req, res, next) => { if (!req.session.user) return res.redirect('/auth/login'); next(); };

router.get('/', async (req, res) => {
    const reviews = await Review.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3);
    const doctors = await Doctor.find().limit(4);
    res.render('index', { title: 'Главная', reviews, doctors });
});

router.get('/about', async (req, res) => {
    const doctors = await Doctor.find();
    res.render('about', { title: 'О нас', doctors });
});

router.get('/services', async (req, res) => {
    const services = await Service.find();
    const categories = [...new Set(services.map(s => s.category))];
    res.render('services', { title: 'Услуги', services, categories });
});

router.get('/doctors', async (req, res) => {
    const doctors = await Doctor.find();
    res.render('doctors', { title: 'Врачи', doctors });
});

router.get('/contacts', (req, res) => res.render('contacts', { title: 'Контакты' }));

router.get('/reviews', async (req, res) => {
    const reviews = await Review.find({ isPublished: true }).sort({ createdAt: -1 });
    res.render('reviews', { title: 'Отзывы', reviews });
});

router.post('/reviews/add', protect, async (req, res) => {
    await Review.create({
        user: req.session.user._id,
        userName: req.session.user.name,
        userAvatar: req.session.user.avatar,
        rating: req.body.rating,
        text: req.body.text,
        photoUrl: req.body.photoUrl
    });
    res.redirect('/reviews');
});

router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.session.user._id);
    const myApps = await Appointment.find({ userId: user._id }).sort({ createdAt: -1 });
    res.render('profile', { title: 'Кабинет', userData: user, myApps });
});

router.post('/profile/update', protect, async (req, res) => {
    await User.findByIdAndUpdate(req.session.user._id, req.body);
    req.session.user = await User.findById(req.session.user._id);
    res.redirect('/profile');
});

// ГЛАВНОЕ: СОЗДАНИЕ ЗАПИСИ
router.post('/appointment/create', async (req, res) => {
    try {
        const d = { ...req.body };
        if(req.session.user) {
            d.userId = req.session.user._id;
            // Если email не ввели в форме, берем из профиля
            if(!d.email) d.email = req.session.user.email;
        }
        
        const newApp = await Appointment.create(d);

        // Отправляем письмо клиенту
        if (d.email) {
            await sendEmail(
                d.email, 
                'Заявка принята | Белая Роза', 
                \`<h2>Здравствуйте, \${d.name}!</h2>
                 <p>Мы получили вашу заявку на услугу: <b>\${d.service || 'Прием'}</b>.</p>
                 <p>Администратор свяжется с вами по телефону <b>\${d.phone}</b> в ближайшее время для подтверждения.</p>
                 <br>
                 <p style="color:gray">С заботой, Клиника "Белая Роза"</p>\`
            );
        }

        if(req.xhr) return res.json({ success: true });
        res.redirect('/');
    } catch(e) {
        console.log(e);
        if(req.xhr) return res.json({ success: false });
        res.redirect('/');
    }
});

module.exports = router;
`;
fs.writeFileSync(path.join('routes', 'index.js'), indexRoute);


// ADMIN ROUTE (Обновление статуса + Письмо)
const adminRoute = `
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Setting = require('../models/Setting');
const sendEmail = require('../utils/mailer');

router.use((req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/auth/login');
    next();
});

router.get('/', async (req, res) => {
    const stats = {
        users: await User.countDocuments(),
        apps: await Appointment.countDocuments(),
        reviews: await Review.countDocuments(),
        newApps: await Appointment.countDocuments({ status: 'new' })
    };
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    const users = await User.find().sort({ createdAt: -1 });
    const reviews = await Review.find().sort({ createdAt: -1 });
    const doctors = await Doctor.find();
    const services = await Service.find();
    const settings = await Setting.find();
    
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);

    res.render('admin/dashboard', { title: 'Admin God Mode', stats, appointments, users, reviews, doctors, services, settings: settingsObj });
});

router.post('/settings/update', async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
        await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    }
    res.redirect('/admin');
});

router.post('/doctor/add', async (req, res) => { await Doctor.create(req.body); res.redirect('/admin'); });
router.post('/doctor/delete', async (req, res) => { await Doctor.findByIdAndDelete(req.body.id); res.redirect('/admin'); });
router.post('/service/add', async (req, res) => { await Service.create(req.body); res.redirect('/admin'); });
router.post('/service/delete', async (req, res) => { await Service.findByIdAndDelete(req.body.id); res.redirect('/admin'); });

// ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ
router.post('/appointment/status', async (req, res) => {
    const app = await Appointment.findById(req.body.id);
    // Цикл статусов: new -> confirmed -> done -> canceled -> new
    const statuses = ['new', 'confirmed', 'done', 'canceled'];
    // Словарь для писем
    const statusMessages = {
        'confirmed': { sub: 'Запись подтверждена', text: 'Ваша запись подтверждена. Ждем вас!' },
        'done': { sub: 'Визит завершен', text: 'Спасибо, что выбрали нас. Будем рады отзыву!' },
        'canceled': { sub: 'Запись отменена', text: 'Ваша запись была отменена. Позвоните нам, если это ошибка.' }
    };

    const nextStatus = statuses[(statuses.indexOf(app.status) + 1) % statuses.length];
    app.status = nextStatus;
    await app.save();

    // Пытаемся найти email (в заявке или у юзера)
    let email = app.email;
    if (!email && app.userId) {
        const u = await User.findById(app.userId);
        if (u) email = u.email;
    }

    // Шлем письмо, если статус важный
    if (email && statusMessages[nextStatus]) {
        await sendEmail(
            email, 
            statusMessages[nextStatus].sub, 
            \`<h3>Статус заявки изменен</h3><p>\${statusMessages[nextStatus].text}</p><p>Услуга: \${app.service}</p>\`
        );
    }

    res.redirect('/admin');
});

router.post('/appointment/delete', async (req, res) => { await Appointment.findByIdAndDelete(req.body.id); res.redirect('/admin'); });

router.post('/user/role', async (req, res) => {
    if(req.body.id !== req.session.user._id.toString()) {
        const user = await User.findById(req.body.id);
        user.role = user.role === 'admin' ? 'user' : 'admin';
        await user.save();
    }
    res.redirect('/admin');
});

router.post('/review/delete', async (req, res) => { await Review.findByIdAndDelete(req.body.id); res.redirect('/admin'); });

module.exports = router;
`;
fs.writeFileSync(path.join('routes', 'admin.js'), adminRoute);
console.log('✅ Роуты обновлены (отправка писем при смене статуса).');


// 4. ОБНОВЛЯЕМ HEADER (Добавляем поле Email в модалку)
const headerPath = path.join('views', 'partials', 'header.ejs');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Ищем форму в модалке и добавляем input email
if (!headerContent.includes('name="email"')) {
    const inputToInject = `
                <input type="text" name="name" placeholder="Имя" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="email" name="email" placeholder="Email (для уведомлений)" value="<%= user ? user.email : '' %>" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
    `;
    // Заменяем старый инпут имени на новый блок с email
    headerContent = headerContent.replace('<input type="text" name="name" placeholder="Имя" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">', inputToInject);
    
    fs.writeFileSync(headerPath, headerContent);
    console.log('✅ Модальное окно обновлено (добавлено поле Email).');
}

console.log('------------------------------------------------');
console.log('🚀 СИСТЕМА ОБНОВЛЕНА!');
console.log('------------------------------------------------');
console.log('⚠️ ЧТОБЫ ПИСЬМА УХОДИЛИ РЕАЛЬНО:');
console.log('1. Открой файл utils/mailer.js');
console.log('2. Впиши свою почту и пароль приложений.');
console.log('------------------------------------------------');
console.log('Запуск: npm run dev');