
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
