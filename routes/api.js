
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
        reply = `Цены от ${s ? s.price : 2000}₽. Подробнее в разделе Услуги.`;
    }
    else if (msg.includes('адрес')) {
        const set = await Setting.findOne({key:'address'});
        reply = set ? set.value : "г. Оренбург, пр. Победы 54";
    }
    else reply = "Нажмите кнопку 'Запись' в меню для связи с врачом.";
    res.json({ reply });
});
module.exports = router;
