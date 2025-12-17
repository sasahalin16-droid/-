const fs = require('fs');
const path = require('path');

const dirs = [
    'public/css', 'public/js', 'public/img',
    'views/partials', 'views/auth', 'views/admin',
    'routes', 'models', 'utils'
];

const files = {};

// 1. PACKAGE.JSON
files['package.json'] = JSON.stringify({
  "name": "belaya-roza-final",
  "version": "8.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "connect-mongo": "^5.0.0",
    "dotenv": "^16.3.1",
    "ejs": "^3.1.9",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "mongoose": "^7.5.0",
    "nodemailer": "^6.9.4"
  }
}, null, 2);

// 2. SERVER.JS (С АВТО-НАПОЛНЕНИЕМ ВСЕГО)
files['server.js'] = `
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();

// Models
const Setting = require('./models/Setting');
const Doctor = require('./models/Doctor');
const Service = require('./models/Service');
const Review = require('./models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/belayaroza';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        await seedDatabase();
    })
    .catch(err => console.log('❌ DB Error:', err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'roza_final_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    const settings = await Setting.find();
    const siteConfig = {};
    settings.forEach(s => siteConfig[s.key] = s.value);
    res.locals.site = siteConfig;
    next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// SEEDER
async function seedDatabase() {
    if ((await Setting.countDocuments()) === 0) {
        await Setting.insertMany([
            { key: 'phone', value: '+7 (3532) 40-50-60' },
            { key: 'address', value: 'г. Оренбург, пр. Победы, 54' },
            { key: 'hero_title', value: 'Искусство женского здоровья' },
            { key: 'hero_subtitle', value: 'Премиальная клиника в центре Оренбурга' }
        ]);
        console.log('🔹 Настройки созданы');
    }
    if ((await Doctor.countDocuments()) === 0) {
        await Doctor.insertMany([
            { name: 'Иванова Мария', spec: 'Гинеколог', exp: '15 лет', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400', bio: 'Врач высшей категории.' },
            { name: 'Петрова Анна', spec: 'УЗИ', exp: '10 лет', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400', bio: 'Эксперт пренатальной диагностики.' },
            { name: 'Смирнов Олег', spec: 'Репродуктолог', exp: '20 лет', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', bio: 'Кандидат медицинских наук.' }
        ]);
        console.log('🔹 Врачи добавлены');
    }
    if ((await Service.countDocuments()) === 0) {
        await Service.insertMany([
            { category: 'Гинекология', name: 'Первичный прием', price: 2500, desc: 'Осмотр и консультация' },
            { category: 'УЗИ', name: 'УЗИ малого таза', price: 2800, desc: 'На аппарате Voluson E10' },
            { category: 'Беременность', name: 'Ведение 1 триместра', price: 45000, desc: 'Все анализы и приемы' }
        ]);
        console.log('🔹 Услуги добавлены');
    }
    if ((await Review.countDocuments()) === 0) {
        await Review.insertMany([
            { userName: 'Елена К.', rating: 5, text: 'Лучшая клиника в городе! Очень вежливый персонал.', isPublished: true, createdAt: new Date() },
            { userName: 'Ольга М.', rating: 5, text: 'Доктор Иванова — врач от Бога. Спасибо за лечение!', isPublished: true, createdAt: new Date() },
            { userName: 'Алина Д.', rating: 5, text: 'Красивый интерьер, нет очередей, всё четко по времени.', isPublished: true, createdAt: new Date() }
        ]);
        console.log('🔹 Отзывы добавлены');
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Server running on http://localhost:' + PORT));
`;

// 3. UTILS (MAILER - ЗАГЛУШКА, ЧТОБЫ НЕ ПАДАЛО)
files['utils/mailer.js'] = `
const nodemailer = require('nodemailer');
// Настрой здесь свои данные, если хочешь реальные письма
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'test@gmail.com', pass: 'test' }
});
const sendEmail = async (to, subject, html) => {
    // console.log('Mail to:', to); // Раскомментируй для дебага
};
module.exports = sendEmail;
`;

// 4. MODELS
files['models/User.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('User',new mongoose.Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true},password:{type:String,required:true},phone:String,role:{type:String,default:'user',enum:['user','admin']},avatar:String,bio:String,address:String,createdAt:{type:Date,default:Date.now}}));`;
files['models/Appointment.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('Appointment',new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User'},name:String,phone:String,email:String,service:String,status:{type:String,default:'new'},createdAt:{type:Date,default:Date.now}}));`;
files['models/Review.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('Review',new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},userName:String,userAvatar:String,rating:Number,text:String,photoUrl:String,isPublished:{type:Boolean,default:true},createdAt:{type:Date,default:Date.now}}));`;
files['models/Doctor.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('Doctor',new mongoose.Schema({name:String,spec:String,exp:String,img:String,bio:String}));`;
files['models/Service.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('Service',new mongoose.Schema({category:String,name:String,price:Number,desc:String}));`;
files['models/Setting.js'] = `const mongoose=require('mongoose');module.exports=mongoose.model('Setting',new mongoose.Schema({key:String,value:String}));`;

// 5. ROUTES
// API
files['routes/api.js'] = `
const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Setting = require('../models/Setting');

router.post('/chat', async (req, res) => {
    const msg = req.body.message.toLowerCase();
    let reply = "";
    if (msg.includes('привет')) reply = "Здравствуйте! Я Роза. Чем помочь?";
    else if (msg.includes('цен') || msg.includes('стоит')) {
        const s = await Service.findOne();
        reply = \`Цены от \${s ? s.price : 2000}₽. Подробнее в разделе Услуги.\`;
    }
    else if (msg.includes('адрес')) {
        const set = await Setting.findOne({key:'address'});
        reply = set ? set.value : "г. Оренбург, пр. Победы 54";
    }
    else reply = "Нажмите кнопку 'Запись' в меню для связи с врачом.";
    res.json({ reply });
});
module.exports = router;
`;

// INDEX (С ФИКСАМИ МОДАЛКИ И ОТЗЫВОВ)
files['routes/index.js'] = `
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

router.get('/about', async (req, res) => res.render('about', { title: 'О нас' }));
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

// ФИКС МОДАЛКИ: ВОЗВРАЩАЕМ JSON
router.post('/appointment/create', async (req, res) => {
    try {
        const d = { ...req.body };
        if(req.session.user) {
            d.userId = req.session.user._id;
            if(!d.email) d.email = req.session.user.email;
        }
        await Appointment.create(d);
        if(d.email) sendEmail(d.email, 'Заявка', 'Мы получили вашу заявку');
        
        return res.json({ success: true });
    } catch(e) {
        console.log(e);
        return res.json({ success: false, message: 'Ошибка сервера' });
    }
});

module.exports = router;
`;

files['routes/auth.js'] = `
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.get('/login', (req, res) => res.render('auth/login', { title: 'Вход', error: null }));
router.get('/register', (req, res) => res.render('auth/register', { title: 'Регистрация', error: null }));

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.render('auth/register', { title: 'Регистрация', error: 'Email занят' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === 'admin@roza.ru' ? 'admin' : 'user';
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();
        req.session.user = user;
        res.redirect(role === 'admin' ? '/admin' : '/profile');
    } catch (e) { res.render('auth/register', { title: 'Регистрация', error: 'Ошибка' }); }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.render('auth/login', { title: 'Вход', error: 'Ошибка' });
        req.session.user = user;
        res.redirect(user.role === 'admin' ? '/admin' : '/profile');
    } catch (e) { res.render('auth/login', { title: 'Вход', error: 'Ошибка' }); }
});
router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
module.exports = router;
`;

files['routes/admin.js'] = `
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Setting = require('../models/Setting');

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
    res.render('admin/dashboard', { title: 'Admin', stats, appointments, users, reviews, doctors, services, settings: settingsObj });
});

router.post('/settings/update', async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    res.redirect('/admin');
});
router.post('/doctor/add', async (req, res) => { await Doctor.create(req.body); res.redirect('/admin'); });
router.post('/doctor/delete', async (req, res) => { await Doctor.findByIdAndDelete(req.body.id); res.redirect('/admin'); });
router.post('/service/add', async (req, res) => { await Service.create(req.body); res.redirect('/admin'); });
router.post('/service/delete', async (req, res) => { await Service.findByIdAndDelete(req.body.id); res.redirect('/admin'); });
router.post('/appointment/status', async (req, res) => {
    const app = await Appointment.findById(req.body.id);
    const statuses = ['new', 'confirmed', 'done'];
    app.status = statuses[(statuses.indexOf(app.status) + 1) % statuses.length];
    await app.save();
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
module.exports = router;
`;

// 6. VIEWS (С ФИКСАМИ)

files['views/partials/header.ejs'] = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> | <%= site.hero_title || 'Белая Роза' %></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Montserrat', sans-serif; background-color: #fafaf9; color: #1c1917; overflow-x: hidden; }
        h1, h2, h3, .serif { font-family: 'Playfair Display', serif; }
        [x-cloak] { display: none !important; }
        .glass { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .bento-card { background: white; border-radius: 24px; padding: 24px; transition: all 0.5s; border: 1px solid #f5f5f4; }
        .bento-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); border-color: #fecdd3; }
        .loader-overlay { position: fixed; inset: 0; z-index: 9999; background: #fff; display: flex; justify-content: center; align-items: center; }
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9000; }
    </style>
</head>
<body x-data="{ mobileMenu: false, modalOpen: false, serviceModal: '', chatOpen: false, chatMsg: '', messages: [{sender:'bot', text:'Здравствуйте! Чем могу помочь?'}] }">

    <!-- MODAL FIXED -->
    <div x-show="modalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4" x-cloak>
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="modalOpen = false" x-transition.opacity></div>
        <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden" x-transition.scale>
            <div class="bg-stone-900 p-8 text-white">
                <h3 class="text-3xl font-serif italic relative z-10">Запись</h3>
                <p class="text-stone-400"><%= site.address %></p>
                <button @click="modalOpen = false" class="absolute top-4 right-4 text-white"><i class="fas fa-times text-xl"></i></button>
            </div>
            <form class="p-8 space-y-4" @submit.prevent="
                const f = new FormData($event.target);
                fetch('/appointment/create', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify(Object.fromEntries(f.entries()))
                }).then(r=>r.json()).then(d=>{
                    if(d.success){alert('Заявка принята!');modalOpen=false;$event.target.reset();}
                    else{alert('Ошибка');}
                })">
                <input type="text" name="name" placeholder="Имя" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3">
                <input type="text" name="phone" placeholder="Телефон" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3">
                <input type="text" name="service" :value="serviceModal" placeholder="Услуга" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3">
                <button class="w-full bg-rose-500 text-white py-4 rounded-xl font-bold">Отправить</button>
            </form>
        </div>
    </div>

    <!-- PRELOADER -->
    <div class="loader-overlay" id="preloader">
        <div class="text-center">
            <div class="text-6xl text-rose-500 mb-4 opacity-0 scale-50" id="loader-icon"><i class="fas fa-spa"></i></div>
            <div class="text-3xl font-serif text-slate-800 opacity-0 translate-y-4" id="loader-text">Белая Роза</div>
        </div>
    </div>

    <!-- CHAT -->
    <div class="chat-widget">
        <div x-show="chatOpen" class="bg-white w-80 h-96 rounded-2xl shadow-xl flex flex-col mb-4 overflow-hidden" x-transition>
            <div class="bg-stone-900 text-white p-3 flex justify-between"><span class="font-bold">Ассистент</span><button @click="chatOpen=false">x</button></div>
            <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50" id="cf">
                <template x-for="m in messages"><div :class="m.sender==='bot'?'text-left':'text-right'"><span class="inline-block px-3 py-2 rounded-xl text-sm" :class="m.sender==='bot'?'bg-white':'bg-rose-500 text-white'" x-html="m.text"></span></div></template>
            </div>
            <form class="p-2 bg-white flex gap-2" @submit.prevent="if(!chatMsg)return; messages.push({sender:'user',text:chatMsg}); let q=chatMsg; chatMsg=''; fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q})}).then(r=>r.json()).then(d=>{messages.push({sender:'bot',text:d.reply});setTimeout(()=>{document.getElementById('cf').scrollTop=999},100)})">
                <input x-model="chatMsg" class="w-full bg-stone-100 rounded px-2 py-1"><button>></button>
            </form>
        </div>
        <button @click="chatOpen=!chatOpen" class="w-12 h-12 bg-rose-500 rounded-full text-white shadow-lg flex items-center justify-center text-xl hover:scale-110 transition float-right"><i class="fas fa-comment"></i></button>
    </div>

    <nav class="fixed w-full z-50 glass top-0 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
            <a href="/" class="flex items-center gap-2 font-serif text-2xl"><div class="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white italic">R</div>Belaya <span class="text-rose-500">Roza</span></a>
            <div class="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-stone-500">
                <a href="/" class="hover:text-rose-500">Главная</a><a href="/services" class="hover:text-rose-500">Услуги</a><a href="/doctors" class="hover:text-rose-500">Врачи</a><a href="/reviews" class="hover:text-rose-500">Отзывы</a><a href="/contacts" class="hover:text-rose-500">Контакты</a>
            </div>
            <div class="flex items-center gap-4">
                <% if(user) { %>
                    <a href="<%= user.role==='admin'?'/admin':'/profile' %>" class="w-8 h-8 rounded-full bg-stone-200 overflow-hidden"><img src="<%= user.avatar||'https://ui-avatars.com/api/?name='+user.name %>" class="w-full h-full object-cover"></a>
                    <a href="/auth/logout" class="text-stone-400 hover:text-red-500 text-lg"><i class="fas fa-sign-out-alt"></i></a>
                <% } else { %>
                    <a href="/auth/login" class="text-xs font-bold uppercase hover:text-rose-500">Войти</a>
                <% } %>
                <button @click="modalOpen=true" class="bg-stone-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase hover:bg-rose-500 transition">Запись</button>
            </div>
        </div>
    </nav>
    <div class="pt-20">
`;

files['views/partials/footer.ejs'] = `</div><footer class="bg-stone-900 text-white py-12 mt-auto"><div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8"><div><div class="font-serif text-2xl italic mb-4">Belaya Roza</div><p class="text-stone-400 text-sm"><%= site.hero_subtitle %></p></div><div><h4 class="font-bold uppercase text-xs mb-4 text-stone-500">Контакты</h4><p class="text-stone-300 text-sm"><%= site.address %></p><p class="text-stone-300 text-sm font-bold"><%= site.phone %></p></div><div><button @click="modalOpen=true" class="w-full border border-stone-700 py-3 rounded-full text-sm uppercase hover:bg-rose-500 hover:border-rose-500 transition">Записаться</button></div></div><div class="text-center mt-10 text-stone-600 text-xs">© 2025 Belaya Roza.</div></footer>
<script>
window.addEventListener('load',()=>{gsap.to("#loader-icon",{opacity:1,scale:1,duration:1});gsap.to("#loader-text",{opacity:1,y:0,duration:0.8,delay:0.2});gsap.to("#preloader",{opacity:0,duration:0.5,delay:1.5,onComplete:()=>document.getElementById('preloader').remove()});});
gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray('.reveal').forEach(elem=>{gsap.from(elem,{scrollTrigger:{trigger:elem,start:"top 85%"},y:30,opacity:0,duration:0.8,ease:"power3.out"})});
</script></body></html>`;

files['views/index.ejs'] = `
<%- include('partials/header') %>
<div class="relative h-[90vh] flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0"><img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1920" class="w-full h-full object-cover opacity-90"><div class="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div></div>
    <div class="relative z-10 max-w-7xl w-full px-4 grid md:grid-cols-2">
        <div class="space-y-6 pt-20">
            <span class="inline-block px-4 py-1 rounded-full border border-rose-500 text-rose-500 text-xs font-bold uppercase tracking-widest bg-white/50 backdrop-blur">Premium</span>
            <h1 class="text-6xl md:text-8xl font-serif italic text-stone-900 leading-none"><%= site.hero_title.split(' ')[0] %> <br/> <span class="text-rose-500 not-italic font-sans font-bold"><%= site.hero_title.split(' ').slice(1).join(' ') %></span></h1>
            <p class="text-xl text-stone-600 max-w-md font-light"><%= site.hero_subtitle %></p>
            <button @click="modalOpen=true" class="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-rose-500 transition shadow-2xl">Записаться</button>
        </div>
    </div>
</div>
<section class="py-32 bg-stone-50">
    <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div class="bento-card reveal group"><div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-6"><i class="fas fa-heartbeat"></i></div><h3 class="text-2xl font-serif italic mb-4">Экспертиза</h3><p class="text-stone-500">Врачи с опытом более 10 лет.</p></div>
        <div class="bento-card reveal group md:col-span-2 bg-stone-900 text-white border-0 relative overflow-hidden"><div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div class="relative z-10 p-4"><h3 class="text-3xl font-serif italic mb-4">Лаборатория</h3><p class="text-stone-400 mb-8 max-w-lg">Результаты анализов в день обращения.</p><a href="/services" class="text-rose-400 font-bold uppercase text-xs border-b border-rose-400">Подробнее</a></div></div>
        <div class="bento-card reveal group"><div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-6"><i class="fas fa-spa"></i></div><h3 class="text-2xl font-serif italic mb-4">Комфорт</h3><p class="text-stone-500">Никаких очередей.</p></div>
    </div>
</section>
<section class="py-24 bg-white relative overflow-hidden">
    <div class="absolute -right-40 top-20 w-96 h-96 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
    <div class="max-w-7xl mx-auto px-4 relative z-10">
        <div class="flex justify-between items-end mb-16"><div><h2 class="text-5xl font-serif italic text-stone-900 mb-4">Отзывы</h2><p class="text-stone-500">Истории пациентов</p></div><a href="/reviews" class="px-8 py-3 rounded-full border border-stone-200 text-xs font-bold uppercase hover:bg-stone-900 hover:text-white transition">Все отзывы</a></div>
        <div class="grid md:grid-cols-3 gap-8">
            <% if(reviews && reviews.length > 0) { reviews.forEach(r => { %>
            <div class="bg-stone-50 p-8 rounded-[32px] hover:shadow-xl transition border border-stone-100 reveal">
                <div class="flex items-center gap-4 mb-6"><img src="<%= r.userAvatar || 'https://ui-avatars.com/api/?name='+r.userName %>" class="w-12 h-12 rounded-full object-cover"><div><div class="font-bold text-stone-900"><%= r.userName %></div><div class="flex text-yellow-400 text-xs"><% for(let i=0; i<r.rating; i++) { %> <i class="fas fa-star"></i> <% } %></div></div></div>
                <p class="text-stone-600 text-sm leading-relaxed mb-4">"<%= r.text %>"</p>
            </div>
            <% }) } else { %><div class="col-span-3 text-center py-10">Отзывов пока нет.</div><% } %>
        </div>
    </div>
</section>
<%- include('partials/footer') %>
`;

// ЗАГЛУШКИ ДЛЯ ОСТАЛЬНЫХ СТРАНИЦ (ЧТОБЫ НЕ БЫЛО 404)
files['views/about.ejs'] = `<%- include('partials/header') %><div class="py-32 text-center"><h1 class="text-5xl font-serif">О нас</h1><p>Лучшая клиника</p></div><%- include('partials/footer') %>`;
files['views/services.ejs'] = `<%- include('partials/header') %><div class="bg-stone-50 py-24"><div class="max-w-7xl mx-auto px-4"><h1 class="text-5xl font-serif text-center mb-16">Услуги</h1><div class="grid md:grid-cols-3 gap-8"><% services.forEach(s => { %><div class="bg-white p-8 rounded-[32px] shadow-sm"><div class="flex justify-between mb-4"><span class="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold"><%= s.category %></span><span class="font-serif italic text-lg"><%= s.price %>₽</span></div><h3 class="text-xl font-bold mb-2"><%= s.name %></h3><p class="text-stone-500 text-sm mb-4"><%= s.desc %></p><button @click="modalOpen=true;serviceModal='<%= s.name %>'" class="w-full border py-2 rounded-xl text-xs uppercase font-bold hover:bg-stone-900 hover:text-white transition">Записаться</button></div><% }) %></div></div></div><%- include('partials/footer') %>`;
files['views/doctors.ejs'] = `<%- include('partials/header') %><div class="py-24 max-w-7xl mx-auto px-4"><h1 class="text-5xl font-serif text-center mb-16">Врачи</h1><div class="grid md:grid-cols-3 gap-8"><% doctors.forEach(d => { %><div class="bg-white rounded-[32px] overflow-hidden shadow-lg"><img src="<%= d.img %>" class="w-full h-80 object-cover"><div class="p-6"><h3 class="text-xl font-bold"><%= d.name %></h3><p class="text-rose-500 mb-2"><%= d.spec %></p><p class="text-xs text-stone-400"><%= d.bio %></p></div></div><% }) %></div></div><%- include('partials/footer') %>`;
files['views/contacts.ejs'] = `<%- include('partials/header') %><div class="h-screen relative"><iframe src="https://yandex.ru/map-widget/v1/?ll=55.127598%2C51.789126&z=16" width="100%" height="100%" class="grayscale opacity-80"></iframe><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="bg-white/90 backdrop-blur p-10 rounded-[40px] shadow-2xl pointer-events-auto"><h1 class="text-4xl font-serif mb-6">Контакты</h1><p class="mb-2"><strong>Адрес:</strong> <%= site.address %></p><p class="mb-2"><strong>Телефон:</strong> <%= site.phone %></p></div></div></div><%- include('partials/footer') %>`;
files['views/reviews.ejs'] = `<%- include('partials/header') %><div class="py-24 max-w-7xl mx-auto px-4"><h1 class="text-5xl font-serif text-center mb-16">Отзывы</h1><div class="grid md:grid-cols-3 gap-8"><% reviews.forEach(r => { %><div class="bg-white p-8 rounded-[32px] shadow-sm"><div class="font-bold mb-2"><%= r.userName %></div><p class="text-stone-600"><%= r.text %></p></div><% }) %></div></div><%- include('partials/footer') %>`;
files['views/profile.ejs'] = `<%- include('partials/header') %><div class="min-h-screen bg-stone-50 pt-10"><div class="max-w-4xl mx-auto px-4"><div class="bg-white p-8 rounded-[40px] shadow-sm mb-8 flex items-center gap-6"><img src="<%= userData.avatar||'https://ui-avatars.com/api/?name='+userData.name %>" class="w-24 h-24 rounded-full"><div><h1 class="text-3xl font-serif"><%= userData.name %></h1><a href="/auth/logout" class="text-red-500 font-bold text-xs uppercase">Выход</a></div></div><div class="bg-white p-8 rounded-[40px] shadow-sm"><h2 class="font-bold mb-4">История</h2><% if(myApps.length){ myApps.forEach(a=>{ %><div class="p-4 border-b last:border-0"><%= a.service||'Прием' %> <span class="float-right badge"><%= a.status %></span></div><% }) }else{ %>Пусто<% } %></div></div></div><%- include('partials/footer') %>`;
files['views/auth/login.ejs'] = `<%- include('../partials/header') %><div class="min-h-[80vh] flex items-center justify-center"><div class="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md"><h1 class="text-3xl font-serif text-center mb-6">Вход</h1><form action="/auth/login" method="POST" class="space-y-4"><input name="email" placeholder="Email" class="w-full bg-stone-50 p-4 rounded-xl"><input type="password" name="password" placeholder="Пароль" class="w-full bg-stone-50 p-4 rounded-xl"><button class="w-full bg-stone-900 text-white py-4 rounded-xl font-bold">Войти</button></form><div class="text-center mt-4"><a href="/auth/register">Регистрация</a></div></div></div><%- include('../partials/footer') %>`;
files['views/auth/register.ejs'] = `<%- include('../partials/header') %><div class="min-h-[80vh] flex items-center justify-center"><div class="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md"><h1 class="text-3xl font-serif text-center mb-6">Регистрация</h1><form action="/auth/register" method="POST" class="space-y-4"><input name="name" placeholder="Имя" class="w-full bg-stone-50 p-4 rounded-xl"><input name="email" placeholder="Email" class="w-full bg-stone-50 p-4 rounded-xl"><input type="password" name="password" placeholder="Пароль" class="w-full bg-stone-50 p-4 rounded-xl"><button class="w-full bg-stone-900 text-white py-4 rounded-xl font-bold">Создать</button></form></div></div><%- include('../partials/footer') %>`;
files['views/admin/dashboard.ejs'] = `<%- include('../partials/header') %><div class="min-h-screen bg-stone-100 pt-10"><div class="max-w-7xl mx-auto px-4"><h1 class="text-4xl font-serif mb-8">Admin</h1><div class="bg-white p-8 rounded-[32px] shadow-sm"><table class="w-full text-left"><thead><tr><th>Имя</th><th>Услуга</th><th>Статус</th><th>Действие</th></tr></thead><tbody><% appointments.forEach(a=>{ %><tr><td class="p-4"><%= a.name %></td><td class="p-4"><%= a.service %></td><td class="p-4"><%= a.status %></td><td class="p-4 flex gap-2"><form action="/admin/appointment/status" method="POST"><input type="hidden" name="id" value="<%= a._id %>"><button class="bg-stone-200 px-2 rounded">OK</button></form><form action="/admin/appointment/delete" method="POST"><input type="hidden" name="id" value="<%= a._id %>"><button class="bg-red-100 px-2 rounded">X</button></form></td></tr><% }) %></tbody></table></div></div></div><%- include('../partials/footer') %>`;

// Create files
dirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
for (const [pathName, content] of Object.entries(files)) {
    const filePath = path.join(__dirname, pathName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${pathName}`);
}
console.log('✅ COMPLETE SYSTEM REINSTALL FINISHED!');