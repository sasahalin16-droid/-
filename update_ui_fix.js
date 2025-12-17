const fs = require('fs');
const path = require('path');

console.log('🎨 Улучшаем интерфейс: Кнопка выхода и Модальное окно...');

const headerPath = path.join('views', 'partials', 'header.ejs');

const newHeaderContent = `
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
    messages: [{sender:'bot', text:'Здравствуйте! Чем могу помочь?'}] 
}">

    <!-- PRELOADER -->
    <div class="loader-overlay" id="preloader">
        <div class="text-center">
            <div class="text-6xl text-rose-500 mb-4 opacity-0 scale-50" id="loader-icon"><i class="fas fa-spa"></i></div>
            <div class="text-3xl font-serif text-slate-800 opacity-0 translate-y-4" id="loader-text">Белая Роза</div>
        </div>
    </div>

    <!-- MODAL -->
    <div x-show="modalOpen" class="fixed inset-0 z-[100] flex items-center justify-center px-4" x-cloak>
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="modalOpen = false" x-transition.opacity></div>
        <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden" x-transition.scale>
            <div class="bg-stone-900 p-8 text-white">
                <h3 class="text-3xl font-serif italic relative z-10">Запись на прием</h3>
                <p class="text-stone-400"><%= site.address %></p>
                <button @click="modalOpen = false" class="absolute top-4 right-4 hover:rotate-90 transition"><i class="fas fa-times text-xl"></i></button>
            </div>
            
            <form action="/appointment/create" method="POST" class="p-8 space-y-4" 
                  @submit.prevent="
                    const form = $event.target;
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    fetch('/appointment/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(r => r.json())
                    .then(d => {
                        if(d.success) {
                            alert('Ваша заявка успешно отправлена!');
                            modalOpen = false;
                            form.reset();
                        } else {
                            alert('Ошибка отправки.');
                        }
                    });
                  ">
                
                <input type="text" name="name" placeholder="Имя" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="text" name="phone" placeholder="Телефон" required class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="email" name="email" placeholder="Email" value="<%= user ? user.email : '' %>" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                <input type="text" name="service" :value="serviceModal" placeholder="Услуга" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 focus:ring-1 focus:ring-rose-500">
                
                <button class="w-full bg-rose-500 text-white py-4 rounded-xl font-bold hover:bg-rose-600 transition">Записаться</button>
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
                    <a href="<%= user.role==='admin'?'/admin':'/profile' %>" class="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-stone-100 hover:border-rose-500 transition" title="Личный кабинет">
                        <img src="<%= user.avatar||'https://ui-avatars.com/api/?name='+user.name %>" class="w-full h-full object-cover">
                    </a>
                    <a href="/auth/logout" class="text-stone-400 hover:text-red-500 transition text-lg" title="Выйти">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                 <% } else { %>
                    <a href="/auth/login" class="text-xs font-bold uppercase hover:text-rose-500 hidden md:block">Войти</a>
                 <% } %>
                 
                 <button @click="modalOpen=true" class="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-rose-500 transition shadow-lg ml-2">Запись</button>
                 <button @click="mobileMenu=!mobileMenu" class="md:hidden text-xl ml-2"><i class="fas fa-bars"></i></button>
            </div>
        </div>

        <!-- MOBILE MENU -->
        <div x-show="mobileMenu" x-collapse x-cloak class="md:hidden bg-white border-t p-4 space-y-4 shadow-xl">
            <a href="/" class="block font-bold">Главная</a>
            <a href="/services" class="block font-bold">Услуги</a>
            <a href="/contacts" class="block font-bold">Контакты</a>
            <% if(user) { %>
                <div class="border-t pt-4 mt-4">
                    <a href="/profile" class="flex items-center gap-2 font-bold text-rose-500 mb-2">
                        <i class="fas fa-user-circle"></i> Мой кабинет
                    </a>
                    <a href="/auth/logout" class="flex items-center gap-2 font-bold text-red-500">
                        <i class="fas fa-sign-out-alt"></i> Выйти
                    </a>
                </div>
            <% } else { %>
                <a href="/auth/login" class="block font-bold text-rose-500 border-t pt-4">Войти</a>
            <% } %>
        </div>
    </nav>
    <div class="pt-20">
`;

fs.writeFileSync(headerPath, newHeaderContent);
console.log('✅ HEADER ОБНОВЛЕН: Ошибка синтаксиса исправлена!');
console.log('-------------------------------------------');
console.log('✨ ЗАПУСТИ ЭТО: node update_ui_fix.js');
console.log('-------------------------------------------');