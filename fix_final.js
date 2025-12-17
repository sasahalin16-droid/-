const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Подключаем модели для наполнения базы
const Review = require('./models/Review');

console.log('🔧 Финальная полировка: Модалка + Отзывы...');

// 1. ЧИНИМ СЕРВЕРНУЮ ЧАСТЬ (routes/index.js)
// Теперь сервер точно поймет, что мы хотим JSON, а не редирект
const indexRoute = `
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const sendEmail = require('../utils/mailer'); // Убедись, что mailer.js существует

const protect = (req, res, next) => { if (!req.session.user) return res.redirect('/auth/login'); next(); };

router.get('/', async (req, res) => {
    // Берем 3 последних опубликованных отзыва
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(3);
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
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.render('reviews', { title: 'Отзывы', reviews });
});

router.post('/reviews/add', protect, async (req, res) => {
    try {
        await Review.create({
            user: req.session.user._id,
            userName: req.session.user.name,
            userAvatar: req.session.user.avatar,
            rating: req.body.rating,
            text: req.body.text,
            photoUrl: req.body.photoUrl
        });
        res.redirect('/reviews');
    } catch(e) { res.redirect('/reviews'); }
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

// ИСПРАВЛЕННЫЙ РОУТ СОЗДАНИЯ ЗАПИСИ
router.post('/appointment/create', async (req, res) => {
    try {
        const d = { ...req.body };
        if(req.session.user) {
            d.userId = req.session.user._id;
            if(!d.email) d.email = req.session.user.email;
        }
        
        await Appointment.create(d);

        // Отправка письма (в блоке try/catch, чтобы не ломать логику если почта не настроена)
        try {
            if (d.email) {
                await sendEmail(d.email, 'Заявка принята', \`<p>Здравствуйте, \${d.name}. Мы получили вашу заявку.</p>\`);
            }
        } catch(mailError) {
            console.log('Mail error (ignored):', mailError.message);
        }

        // ЯВНЫЙ ОТВЕТ JSON
        return res.json({ success: true, message: 'Заявка успешно создана' });
        
    } catch(e) {
        console.error(e);
        return res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

module.exports = router;
`;
fs.writeFileSync(path.join('routes', 'index.js'), indexRoute);
console.log('✅ Серверный роут исправлен (теперь всегда возвращает JSON).');


// 2. ЧИНИМ МОДАЛКУ В HEADER (views/partials/header.ejs)
// Добавляем состояние загрузки (loading) и четкую обработку JSON
const headerPath = path.join('views', 'partials', 'header.ejs');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Заменяем старую форму на новую, умную
const oldFormStart = `<form action="/appointment/create" method="POST" class="p-8 space-y-4"`;
// Ищем начало формы и заменяем весь блок скрипта внутри
if (headerContent.includes(oldFormStart)) {
    // Просто перезапишем весь файл header заново, так надежнее, чтобы не искать куски строк
    const newHeader = `
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
        .loader-overlay { position: fixed; inset: 0; z-index: 9999; background: #fff; display: flex; justify-content: center; align-items: center; }
        .chat-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9000; }
    </style>
</head>
<body x-data="{ 
    mobileMenu: false, 
    modalOpen: false, 
    serviceModal: '', 
    chatOpen: false, 
    chatMsg: '', 
    isLoading: false,
    messages: [{sender:'bot', text:'Здравствуйте! Чем могу помочь?'}] 
}">

    <!-- PRELOADER -->
    <div class="loader-overlay" id="preloader">
        <div class="text-center">
            <div class="text-6xl text-rose-500 mb-4 opacity-0 scale-50" id="loader-icon"><i class="fas fa-spa"></i></div>
            <div class="text-3xl font-serif text-slate-800 opacity-0 translate-y-4" id="loader-text">Белая Роза</div>
        </div>
    </div>

    <!-- MODAL FIXED -->
    <div x-show="modalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4" x-cloak>
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="modalOpen = false" x-transition.opacity></div>
        <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden" x-transition.scale>
            <div class="bg-stone-900 p-8 text-white relative">
                <h3 class="text-3xl font-serif italic relative z-10">Запись на прием</h3>
                <p class="text-stone-400 relative z-10"><%= site.address %></p>
                <button @click="modalOpen = false" class="absolute top-4 right-4 text-white/50 hover:text-white transition"><i class="fas fa-times text-xl"></i></button>
            </div>
            
            <form class="p-8 space-y-4" 
                  @submit.prevent="
                    isLoading = true;
                    const formData = new FormData($event.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    fetch('/appointment/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(r => r.json())
                    .then(d => {
                        isLoading = false;
                        if(d.success) {
                            alert('Спасибо! Ваша заявка принята. Мы свяжемся с вами.');
                            modalOpen = false;
                            $event.target.reset();
                        } else {
                            alert('Ошибка: ' + d.message);
                        }
                    })
                    .catch(err => {
                        isLoading = false;
                        alert('Ошибка сети.');
                    });
                  ">
                
                <input type="text" name="name" placeholder="Имя" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="text" name="phone" placeholder="Телефон" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="email" name="email" placeholder="Email (для уведомлений)" value="<%= user ? user.email : '' %>" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="text" name="service" :value="serviceModal" placeholder="Услуга" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                
                <button :disabled="isLoading" class="w-full bg-rose-500 text-white py-4 rounded-xl font-bold hover:bg-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <span x-show="!isLoading">Записаться</span>
                    <span x-show="isLoading">Отправка...</span>
                </button>
            </form>
        </div>
    </div>

    <!-- CHATBOT -->
    <div class="chat-widget">
        <div x-show="chatOpen" class="bg-white w-80 h-96 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-stone-100" x-transition>
            <div class="bg-stone-900 text-white p-3 flex justify-between items-center"><span class="font-bold text-sm">Ассистент</span><button @click="chatOpen=false"><i class="fas fa-times"></i></button></div>
            <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50" id="chat-feed">
                <template x-for="m in messages">
                    <div :class="m.sender==='bot' ? 'self-start' : 'self-end'" class="flex flex-col">
                        <div :class="m.sender==='bot' ? 'bg-white' : 'bg-rose-500 text-white'" class="px-4 py-2 rounded-xl text-sm shadow-sm max-w-[85%]" x-html="m.text"></div>
                    </div>
                </template>
            </div>
            <form class="p-3 bg-white border-t" @submit.prevent="if(!chatMsg)return; messages.push({sender:'user', text:chatMsg}); let q=chatMsg; chatMsg=''; fetch('/api/chat',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:q})}).then(r=>r.json()).then(d=>{messages.push({sender:'bot', text:d.reply}); setTimeout(()=>{document.getElementById('chat-feed').scrollTop=9999},100)})">
                <div class="flex gap-2">
                    <input type="text" x-model="chatMsg" placeholder="Ваш вопрос..." class="w-full bg-stone-100 rounded-lg px-3 py-2 text-sm outline-none">
                    <button class="text-rose-500 px-2"><i class="fas fa-paper-plane"></i></button>
                </div>
            </form>
        </div>
        <button @click="chatOpen = !chatOpen" class="w-14 h-14 bg-rose-500 rounded-full text-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition float-right"><i class="fas fa-comment-dots"></i></button>
    </div>

    <!-- NAV -->
    <nav class="fixed w-full z-50 glass top-0 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
            <a href="/" class="flex items-center gap-3 font-serif text-2xl">
                <div class="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white italic text-lg shadow-lg">R</div>
                <span>Belaya <span class="text-rose-500 italic">Roza</span></span>
            </a>
            <div class="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-stone-500">
                <a href="/" class="hover:text-rose-500 transition">Главная</a>
                <a href="/about" class="hover:text-rose-500 transition">О нас</a>
                <a href="/services" class="hover:text-rose-500 transition">Услуги</a>
                <a href="/doctors" class="hover:text-rose-500 transition">Врачи</a>
                <a href="/contacts" class="hover:text-rose-500 transition">Контакты</a>
            </div>
            <div class="flex items-center gap-4">
                 <% if(user) { %>
                    <a href="<%= user.role==='admin'?'/admin':'/profile' %>" class="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-stone-100 hover:border-rose-500 transition" title="Личный кабинет"><img src="<%= user.avatar||'https://ui-avatars.com/api/?name='+user.name %>" class="w-full h-full object-cover"></a>
                    <a href="/auth/logout" class="text-stone-400 hover:text-red-500 transition text-lg" title="Выйти"><i class="fas fa-sign-out-alt"></i></a>
                 <% } else { %>
                    <a href="/auth/login" class="text-xs font-bold uppercase hover:text-rose-500 hidden md:block">Войти</a>
                 <% } %>
                 <button @click="modalOpen=true" class="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-rose-500 transition shadow-lg ml-2">Запись</button>
                 <button @click="mobileMenu=!mobileMenu" class="md:hidden text-xl ml-2"><i class="fas fa-bars"></i></button>
            </div>
        </div>
        <div x-show="mobileMenu" x-collapse x-cloak class="md:hidden bg-white border-t p-4 space-y-4 shadow-xl">
            <a href="/" class="block font-bold">Главная</a>
            <a href="/services" class="block font-bold">Услуги</a>
            <a href="/contacts" class="block font-bold">Контакты</a>
            <% if(user) { %>
                <div class="border-t pt-4 mt-4">
                    <a href="/profile" class="flex items-center gap-2 font-bold text-rose-500 mb-2"><i class="fas fa-user-circle"></i> Кабинет</a>
                    <a href="/auth/logout" class="flex items-center gap-2 font-bold text-red-500"><i class="fas fa-sign-out-alt"></i> Выйти</a>
                </div>
            <% } else { %>
                <a href="/auth/login" class="block font-bold text-rose-500 border-t pt-4">Войти</a>
            <% } %>
        </div>
    </nav>
    <div class="pt-20">
    `;
    fs.writeFileSync(headerPath, newHeader);
    console.log('✅ Модальное окно исправлено: Теперь закрывается и не перезагружает страницу.');
}

// 3. ДОБАВЛЯЕМ ОТЗЫВЫ НА ГЛАВНУЮ + НАПОЛНЯЕМ БАЗУ
// Обновляем index.ejs, чтобы отзывы выглядели красиво
const indexPagePath = path.join('views', 'index.ejs');
const indexPageContent = `
<%- include('partials/header') %>
<!-- Hero -->
<div class="relative h-[90vh] flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1920" class="w-full h-full object-cover opacity-90">
        <div class="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
    </div>
    <div class="relative z-10 max-w-7xl w-full px-4 grid md:grid-cols-2">
        <div class="space-y-6 pt-20">
            <span class="inline-block px-4 py-1 rounded-full border border-rose-500 text-rose-500 text-xs font-bold uppercase tracking-widest bg-white/50 backdrop-blur">Premium Healthcare</span>
            <h1 class="text-6xl md:text-8xl font-serif italic text-stone-900 leading-none">
                <%= site.hero_title.split(' ')[0] %> <br/> <span class="text-rose-500 not-italic font-sans font-bold"><%= site.hero_title.split(' ').slice(1).join(' ') %></span>
            </h1>
            <p class="text-xl text-stone-600 max-w-md font-light"><%= site.hero_subtitle %></p>
            <div class="flex gap-4 pt-4">
                <button @click="modalOpen = true" class="bg-stone-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-rose-500 transition shadow-2xl">Записаться</button>
            </div>
        </div>
    </div>
</div>

<!-- Features -->
<section class="py-32 bg-stone-50">
    <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div class="bento-card reveal group">
            <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-6 group-hover:scale-110 transition"><i class="fas fa-heartbeat"></i></div>
            <h3 class="text-2xl font-serif italic mb-4">Экспертиза</h3>
            <p class="text-stone-500">Врачи с опытом более 10 лет, постоянное повышение квалификации в Европе и Москве.</p>
        </div>
        <div class="bento-card reveal group md:col-span-2 bg-stone-900 text-white border-0 relative overflow-hidden">
            <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div class="relative z-10 p-4">
                <h3 class="text-3xl font-serif italic mb-4">Лаборатория</h3>
                <p class="text-stone-400 mb-8 max-w-lg">Собственный диагностический центр. Результаты анализов в день обращения.</p>
                <a href="/services" class="text-rose-400 font-bold uppercase text-xs tracking-widest border-b border-rose-400">Подробнее</a>
            </div>
        </div>
        <div class="bento-card reveal group">
            <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-6 group-hover:scale-110 transition"><i class="fas fa-spa"></i></div>
            <h3 class="text-2xl font-serif italic mb-4">Комфорт</h3>
            <p class="text-stone-500">Никаких очередей. Удобные зоны ожидания, чай, кофе и персональный менеджер.</p>
        </div>
    </div>
</section>

<!-- REVIEWS SECTION (NEW) -->
<section class="py-24 bg-white relative overflow-hidden">
    <div class="absolute -right-40 top-20 w-96 h-96 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
    <div class="max-w-7xl mx-auto px-4 relative z-10">
        <div class="flex justify-between items-end mb-16">
            <div>
                <h2 class="text-5xl font-serif italic text-stone-900 mb-4">Что говорят пациенты</h2>
                <p class="text-stone-500">Реальные истории выздоровления</p>
            </div>
            <a href="/reviews" class="hidden md:inline-block px-8 py-3 rounded-full border border-stone-200 text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition">Все отзывы</a>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            <% if(reviews && reviews.length > 0) { %>
                <% reviews.forEach(r => { %>
                <div class="bg-stone-50 p-8 rounded-[32px] hover:shadow-xl transition duration-500 hover:-translate-y-2 border border-stone-100 reveal">
                    <div class="flex items-center gap-4 mb-6">
                        <img src="<%= r.userAvatar || 'https://ui-avatars.com/api/?name='+r.userName %>" class="w-12 h-12 rounded-full object-cover">
                        <div>
                            <div class="font-bold text-stone-900"><%= r.userName %></div>
                            <div class="flex text-yellow-400 text-xs">
                                <% for(let i=0; i<r.rating; i++) { %> <i class="fas fa-star"></i> <% } %>
                            </div>
                        </div>
                    </div>
                    <p class="text-stone-600 text-sm leading-relaxed mb-4">"<%= r.text %>"</p>
                    <div class="text-xs text-stone-400 uppercase tracking-wider"><%= new Date(r.createdAt).toLocaleDateString() %></div>
                </div>
                <% }) %>
            <% } else { %>
                <div class="col-span-3 text-center py-10 bg-stone-50 rounded-[32px]">
                    <p class="text-stone-400 mb-4">Отзывов пока нет. Будьте первыми!</p>
                    <a href="/reviews" class="text-rose-500 font-bold border-b border-rose-500">Написать отзыв</a>
                </div>
            <% } %>
        </div>
        
        <div class="text-center mt-12 md:hidden">
             <a href="/reviews" class="inline-block px-8 py-3 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-widest">Все отзывы</a>
        </div>
    </div>
</section>

<!-- DOCTORS PREVIEW -->
<section class="py-24 bg-stone-50">
    <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-4xl font-serif italic text-center mb-16">Наши эксперты</h2>
        <div class="grid md:grid-cols-4 gap-6">
            <% doctors.forEach(doc => { %>
                <div class="bg-white rounded-[24px] overflow-hidden shadow-sm group reveal">
                    <div class="h-64 overflow-hidden relative">
                        <img src="<%= doc.img %>" class="w-full h-full object-cover transition duration-700 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span class="text-white font-bold border border-white px-4 py-2 rounded-full text-xs uppercase">Профиль</span>
                        </div>
                    </div>
                    <div class="p-6 text-center">
                        <h3 class="font-bold text-lg mb-1"><%= doc.name %></h3>
                        <p class="text-rose-500 text-xs uppercase tracking-widest"><%= doc.spec %></p>
                    </div>
                </div>
            <% }) %>
        </div>
    </div>
</section>

<%- include('partials/footer') %>
`;
fs.writeFileSync(indexPagePath, indexPageContent);
console.log('✅ Главная страница обновлена: добавлен красивый блок отзывов.');

// 4. НАПОЛНЯЕМ БАЗУ ОТЗЫВАМИ (SEEDER)
async function seedReviews() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/belayaroza';
    await mongoose.connect(MONGO_URI);
    
    const count = await Review.countDocuments();
    if(count === 0) {
        await Review.insertMany([
            { userName: 'Елена С.', rating: 5, text: 'Потрясающая клиника! Врач Иванова Мария — настоящий профессионал. Все прошло очень деликатно и комфортно.', isPublished: true },
            { userName: 'Анна К.', rating: 5, text: 'Сдавала анализы, результаты пришли на почту уже через 2 часа. Сервис на высоте, никакого ожидания в очередях.', isPublished: true },
            { userName: 'Виктория М.', rating: 5, text: 'Вела здесь беременность. Очень рада, что выбрала Белую Розу. Чувствовала заботу на каждом приеме.', isPublished: true }
        ]);
        console.log('✅ База данных наполнена тестовыми отзывами!');
    } else {
        console.log('ℹ️ Отзывы уже есть в базе, пропускаем наполнение.');
    }
    await mongoose.disconnect();
}

seedReviews().then(() => {
    console.log('-------------------------------------------');
    console.log('✨ ВСЕ ГОТОВО! ПЕРЕЗАПУСТИ СЕРВЕР: npm run dev');
    console.log('-------------------------------------------');
});