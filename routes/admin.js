
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
