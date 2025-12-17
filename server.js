
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
