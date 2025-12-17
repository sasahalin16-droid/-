const fs = require('fs');
const path = require('path');

console.log('🤖 Апгрейд Ассистента Розы до уровня AI...');

// 1. ОБНОВЛЯЕМ ЛОГИКУ БОТА (routes/api.js)
// Теперь он ищет ответы в Базе Данных (Врачи, Услуги, Настройки)

const apiRouteContent = `
const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Setting = require('../models/Setting');

router.post('/chat', async (req, res) => {
    try {
        const msg = req.body.message.toLowerCase();
        let reply = "";

        // Загружаем настройки для контактов
        const settings = await Setting.find();
        const getSet = (k) => settings.find(s => s.key === k)?.value || '';

        // 1. Приветствие
        if (msg.includes('привет') || msg.includes('здравств')) {
            reply = "Здравствуйте! Я Роза, ваш виртуальный помощник. Спросите меня о ценах, врачах или контактах.";
        }
        
        // 2. Поиск Врачей (Ищет по имени или специальности)
        else if (msg.includes('врач') || msg.includes('доктор') || msg.includes('специалист')) {
            const doctors = await Doctor.find();
            // Ищем совпадение имени в сообщении
            const foundDoc = doctors.find(d => msg.includes(d.name.split(' ')[0].toLowerCase()) || msg.includes(d.name.split(' ')[1]?.toLowerCase()));
            
            if (foundDoc) {
                reply = \`<b>\${foundDoc.name}</b> (\${foundDoc.spec}) ведет прием. <br>Стаж: \${foundDoc.exp}. <br><br>Нажмите кнопку "Запись", чтобы попасть к ней.\`;
            } else {
                reply = "У нас работают лучшие специалисты: " + doctors.map(d => d.name).join(', ') + ". О ком рассказать подробнее?";
            }
        }

        // 3. Поиск Услуг и Цен
        else if (msg.includes('цен') || msg.includes('стоит') || msg.includes('сколько') || msg.includes('прайс') || msg.includes('узи') || msg.includes('прием')) {
            const services = await Service.find();
            // Ищем услуги, название которых упоминается в сообщении
            const foundServices = services.filter(s => msg.includes(s.name.toLowerCase()) || msg.includes(s.category.toLowerCase()));

            if (foundServices.length > 0) {
                reply = "Вот что я нашла:<br>" + foundServices.map(s => \`— \${s.name}: <b>\${s.price}₽</b>\`).join('<br>');
            } else {
                if(msg.includes('цен') || msg.includes('стоит')) {
                    reply = "Первичный прием стоит от 2500₽. Точные цены есть в разделе 'Услуги'. Какая процедура вас интересует?";
                }
            }
        }

        // 4. Контакты и Адрес
        else if (msg.includes('адрес') || msg.includes('где') || msg.includes('находит')) {
            reply = \`Мы находимся по адресу: <b>\${getSet('address')}</b>. Ждем вас!\`;
        }
        else if (msg.includes('телефон') || msg.includes('номер') || msg.includes('звон')) {
            reply = \`Наш телефон: <b>\${getSet('phone')}</b>. Звоните в любое время.\`;
        }
        
        // 5. Запись
        else if (msg.includes('запис')) {
            reply = "Чтобы записаться, нажмите кнопку <b>'Запись'</b> в верхнем меню или оставьте свой номер здесь.";
        }

        // Если ничего не поняли
        if (!reply) {
            reply = "Я пока учусь и не поняла ваш вопрос. 😔 <br>Попробуйте спросить 'Сколько стоит УЗИ?' или 'Адрес клиники'.";
        }

        // Имитация задержки "печатает..."
        setTimeout(() => res.json({ reply }), 600);

    } catch (e) {
        console.log(e);
        res.json({ reply: "Упс, я немного сломалась. Позовите администратора." });
    }
});

module.exports = router;
`;

fs.writeFileSync(path.join('routes', 'api.js'), apiRouteContent);
console.log('✅ Логика (Backend) обновлена.');


// 2. ОБНОВЛЯЕМ FRONTEND (header.ejs)
// Нужно, чтобы чат понимал HTML теги (<b>, <br>), а не выводил их текстом.
// Меняем x-text на x-html

const headerPath = path.join('views', 'partials', 'header.ejs');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Ищем старый вывод текста и меняем на HTML вывод
if (headerContent.includes('x-text="m.text"')) {
    headerContent = headerContent.replace('x-text="m.text"', 'x-html="m.text"');
    fs.writeFileSync(headerPath, headerContent);
    console.log('✅ Интерфейс (Frontend) обновлен: добавлена поддержка HTML в чате.');
} else {
    console.log('⚠️ Интерфейс уже обновлен или не найден.');
}

console.log('------------------------------------------------');
console.log('🚀 ГОТОВО! Теперь перезапусти сервер: npm run dev');
console.log('------------------------------------------------');
console.log('Попробуй спросить бота:');
console.log('- "Сколько стоит прием?"');
console.log('- "Есть врач Иванова?"');
console.log('- "Какой адрес?"');