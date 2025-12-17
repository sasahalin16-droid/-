
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
