const fs = require('fs');
const path = require('path');

console.log('🔄 Возвращаем расширенный функционал (Админка + Профиль + Отзывы)...');

// 1. ВОЗВРАЩАЕМ МОЩНУЮ АДМИНКУ (CMS)
// С вкладками, редактором контента, управлением врачами и услугами
const adminPath = path.join('views', 'admin', 'dashboard.ejs');
const adminContent = `
<%- include('../partials/header') %>
<div class="min-h-screen bg-stone-100 pb-20 pt-10" x-data="{ tab: 'apps' }">
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-4xl font-serif italic text-stone-800">CMS Panel</h1>
                <p class="text-stone-500 text-sm">Центр управления полетами</p>
            </div>
            
            <!-- TABS -->
            <div class="bg-white p-1 rounded-xl shadow-sm inline-flex flex-wrap justify-center gap-1">
                <button @click="tab='apps'" :class="tab==='apps'?'bg-stone-900 text-white shadow':'text-stone-500 hover:bg-stone-50'" class="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Заявки</button>
                <button @click="tab='content'" :class="tab==='content'?'bg-stone-900 text-white shadow':'text-stone-500 hover:bg-stone-50'" class="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Контент</button>
                <button @click="tab='doctors'" :class="tab==='doctors'?'bg-stone-900 text-white shadow':'text-stone-500 hover:bg-stone-50'" class="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Врачи</button>
                <button @click="tab='services'" :class="tab==='services'?'bg-stone-900 text-white shadow':'text-stone-500 hover:bg-stone-50'" class="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Услуги</button>
                <button @click="tab='users'" :class="tab==='users'?'bg-stone-900 text-white shadow':'text-stone-500 hover:bg-stone-50'" class="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Люди</button>
            </div>
        </div>

        <!-- STATS -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <div class="text-xs uppercase tracking-widest text-stone-400 mb-2">Новых заявок</div>
                <div class="text-3xl font-serif text-stone-800"><%= stats.newApps %></div>
            </div>
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <div class="text-xs uppercase tracking-widest text-stone-400 mb-2">Всего записей</div>
                <div class="text-3xl font-serif text-stone-800"><%= stats.apps %></div>
            </div>
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <div class="text-xs uppercase tracking-widest text-stone-400 mb-2">Клиентов</div>
                <div class="text-3xl font-serif text-stone-800"><%= stats.users %></div>
            </div>
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <div class="text-xs uppercase tracking-widest text-stone-400 mb-2">Отзывов</div>
                <div class="text-3xl font-serif text-stone-800"><%= stats.reviews %></div>
            </div>
        </div>

        <!-- TAB: ЗАЯВКИ (APPLICATIONS) -->
        <div x-show="tab==='apps'" class="bg-white rounded-[32px] shadow-xl border border-stone-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-stone-50 text-xs uppercase tracking-widest text-stone-500 border-b border-stone-100">
                        <tr>
                            <th class="p-6">Клиент</th>
                            <th class="p-6">Услуга</th>
                            <th class="p-6">Статус</th>
                            <th class="p-6">Действие</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                        <% appointments.forEach(app => { %>
                        <tr class="hover:bg-stone-50 transition">
                            <td class="p-6">
                                <div class="font-bold text-stone-900"><%= app.name %></div>
                                <div class="text-xs text-stone-400 font-mono"><%= app.phone %></div>
                                <% if(app.email) { %><div class="text-xs text-stone-400"><%= app.email %></div><% } %>
                            </td>
                            <td class="p-6">
                                <span class="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold uppercase"><%= app.service || 'Общее' %></span>
                            </td>
                            <td class="p-6">
                                <span class="px-3 py-1 rounded-full text-xs font-bold uppercase 
                                    <%= app.status === 'new' ? 'bg-rose-100 text-rose-600' : 
                                       app.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                                       app.status === 'done' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500' %>">
                                    <%= app.status %>
                                </span>
                            </td>
                            <td class="p-6 flex gap-2">
                                <form action="/admin/appointment/status" method="POST">
                                    <input type="hidden" name="id" value="<%= app._id %>">
                                    <button class="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-800 hover:text-white transition flex items-center justify-center" title="Сменить статус"><i class="fas fa-sync-alt text-xs"></i></button>
                                </form>
                                <form action="/admin/appointment/delete" method="POST" onsubmit="return confirm('Удалить?')">
                                    <input type="hidden" name="id" value="<%= app._id %>">
                                    <button class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                                </form>
                            </td>
                        </tr>
                        <% }) %>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB: КОНТЕНТ (SETTINGS) -->
        <div x-show="tab==='content'" class="bg-white rounded-[32px] p-8 shadow-xl border border-stone-100" x-cloak>
            <h3 class="text-2xl font-serif italic mb-6">Настройки сайта</h3>
            <form action="/admin/settings/update" method="POST" class="grid md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2 text-stone-400">Заголовок (Главная)</label>
                    <input name="hero_title" value="<%= settings.hero_title %>" class="w-full bg-stone-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-rose-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2 text-stone-400">Подзаголовок</label>
                    <input name="hero_subtitle" value="<%= settings.hero_subtitle %>" class="w-full bg-stone-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-rose-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2 text-stone-400">Телефон</label>
                    <input name="phone" value="<%= settings.phone %>" class="w-full bg-stone-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-rose-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest mb-2 text-stone-400">Адрес</label>
                    <input name="address" value="<%= settings.address %>" class="w-full bg-stone-50 border-0 rounded-xl p-4 focus:ring-2 focus:ring-rose-500 transition">
                </div>
                <div class="md:col-span-2">
                    <button class="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-rose-500 transition">Сохранить изменения</button>
                </div>
            </form>
        </div>

        <!-- TAB: ВРАЧИ (DOCTORS) -->
        <div x-show="tab==='doctors'" class="space-y-8" x-cloak>
            <!-- Add Form -->
            <div class="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
                <h3 class="font-bold uppercase tracking-widest text-xs mb-4 text-stone-400">Добавить специалиста</h3>
                <form action="/admin/doctor/add" method="POST" class="grid md:grid-cols-5 gap-4">
                    <input name="name" placeholder="ФИО" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="spec" placeholder="Специальность" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="exp" placeholder="Стаж" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="img" placeholder="URL Фото" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <button class="bg-rose-500 text-white rounded-xl p-3 font-bold uppercase text-xs hover:bg-rose-600 transition">Добавить</button>
                </form>
            </div>
            <!-- List -->
            <div class="grid md:grid-cols-3 gap-6">
                <% doctors.forEach(d => { %>
                <div class="bg-white p-4 rounded-3xl shadow-sm flex items-center gap-4 border border-stone-100">
                    <img src="<%= d.img %>" class="w-16 h-16 rounded-2xl object-cover">
                    <div class="flex-1 min-w-0">
                        <div class="font-bold text-stone-900 truncate"><%= d.name %></div>
                        <div class="text-xs text-rose-500 uppercase tracking-widest truncate"><%= d.spec %></div>
                    </div>
                    <form action="/admin/doctor/delete" method="POST" onsubmit="return confirm('Удалить?')">
                        <input type="hidden" name="id" value="<%= d._id %>">
                        <button class="text-stone-300 hover:text-red-500 transition"><i class="fas fa-trash"></i></button>
                    </form>
                </div>
                <% }) %>
            </div>
        </div>

        <!-- TAB: УСЛУГИ (SERVICES) -->
        <div x-show="tab==='services'" class="space-y-8" x-cloak>
             <div class="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100">
                <h3 class="font-bold uppercase tracking-widest text-xs mb-4 text-stone-400">Добавить услугу</h3>
                <form action="/admin/service/add" method="POST" class="grid md:grid-cols-5 gap-4">
                    <input name="category" placeholder="Категория" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="name" placeholder="Название" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="price" placeholder="Цена" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <input name="desc" placeholder="Описание" class="bg-stone-50 border-0 rounded-xl p-3 text-sm">
                    <button class="bg-rose-500 text-white rounded-xl p-3 font-bold uppercase text-xs hover:bg-rose-600 transition">Добавить</button>
                </form>
            </div>
            <div class="bg-white rounded-[32px] shadow-sm p-6 border border-stone-100">
                <table class="w-full text-left text-sm">
                    <tbody>
                        <% services.forEach(s => { %>
                        <tr class="border-b last:border-0 border-stone-100 group hover:bg-stone-50">
                            <td class="py-3 px-4 text-stone-400 text-xs uppercase"><%= s.category %></td>
                            <td class="py-3 px-4 font-bold text-stone-800"><%= s.name %></td>
                            <td class="py-3 px-4 font-serif italic text-lg"><%= s.price %>₽</td>
                            <td class="py-3 px-4 text-right">
                                <form action="/admin/service/delete" method="POST" class="inline">
                                    <input type="hidden" name="id" value="<%= s._id %>">
                                    <button class="text-stone-300 hover:text-red-500"><i class="fas fa-times"></i></button>
                                </form>
                            </td>
                        </tr>
                        <% }) %>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB: ЛЮДИ (USERS) -->
        <div x-show="tab==='users'" class="grid md:grid-cols-3 gap-4" x-cloak>
             <% users.forEach(u => { %>
             <div class="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
                 <img src="<%= u.avatar || 'https://ui-avatars.com/api/?name='+u.name %>" class="w-12 h-12 rounded-full object-cover">
                 <div class="flex-1 min-w-0">
                     <div class="font-bold text-stone-900 truncate"><%= u.name %></div>
                     <div class="text-xs text-stone-400 truncate"><%= u.email %></div>
                     <div class="text-[10px] uppercase font-bold text-rose-500 mt-1"><%= u.role %></div>
                 </div>
                 <form action="/admin/user/role" method="POST">
                    <input type="hidden" name="id" value="<%= u._id %>">
                    <button class="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-900 hover:text-white transition flex items-center justify-center text-xs"><i class="fas fa-user-shield"></i></button>
                 </form>
             </div>
             <% }) %>
        </div>

    </div>
</div>
<%- include('../partials/footer') %>
`;
fs.writeFileSync(adminPath, adminContent);
console.log('✅ Админ-панель восстановлена (вкладки, редактор, таблицы).');


// 2. ВОЗВРАЩАЕМ ПРОКАЧАННЫЙ ПРОФИЛЬ
// С редактированием аватара, био и группой крови
const profilePath = path.join('views', 'profile.ejs');
const profileContent = `
<%- include('partials/header') %>
<div class="min-h-screen bg-stone-50 pt-10 pb-20">
    <div class="max-w-6xl mx-auto px-4">
        
        <!-- Header Card -->
        <div class="bg-white rounded-[40px] shadow-xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-rose-100 to-stone-200 opacity-50"></div>
            
            <div class="relative z-10 w-32 h-32 rounded-full p-1 bg-white shadow-lg -mt-10 md:mt-0">
                <img src="<%= userData.avatar || 'https://ui-avatars.com/api/?name=' + userData.name %>" class="w-full h-full rounded-full object-cover">
            </div>
            
            <div class="relative z-10 text-center md:text-left flex-1">
                <h1 class="text-4xl font-serif italic text-stone-900"><%= userData.name %></h1>
                <p class="text-stone-500 mt-1"><%= userData.email %> • Пациент</p>
            </div>
            
            <div class="relative z-10">
                <a href="/auth/logout" class="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white transition font-bold text-xs uppercase tracking-widest">
                    <i class="fas fa-sign-out-alt"></i> Выход
                </a>
            </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
            
            <!-- Settings Column -->
            <div class="md:col-span-1 space-y-6">
                <div class="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100">
                    <h3 class="font-bold uppercase tracking-widest text-xs mb-6 text-stone-400 flex items-center gap-2">
                        <i class="fas fa-cog"></i> Настройки профиля
                    </h3>
                    <form action="/profile/update" method="POST" class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-stone-400 ml-2">Имя</label>
                            <input type="text" name="name" value="<%= userData.name %>" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-400 ml-2">Телефон</label>
                            <input type="text" name="phone" value="<%= userData.phone || '' %>" placeholder="+7..." class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-400 ml-2">Аватар (ссылка)</label>
                            <input type="text" name="avatar" value="<%= userData.avatar || '' %>" placeholder="https://..." class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-400 ml-2">Адрес</label>
                            <input type="text" name="address" value="<%= userData.address || '' %>" placeholder="Ваш адрес" class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-stone-400 ml-2">О себе / Аллергии</label>
                            <textarea name="bio" rows="3" placeholder="Заметки для врача..." class="w-full bg-stone-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition resize-none"><%= userData.bio || '' %></textarea>
                        </div>
                        <button class="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500 transition shadow-lg">Сохранить</button>
                    </form>
                </div>
            </div>

            <!-- History Column -->
            <div class="md:col-span-2 space-y-6">
                <div class="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 min-h-[400px]">
                    <h3 class="font-bold uppercase tracking-widest text-xs mb-6 text-stone-400 flex items-center gap-2">
                        <i class="fas fa-history"></i> История посещений
                    </h3>
                    
                    <% if(myApps.length > 0) { %>
                        <div class="space-y-4">
                            <% myApps.forEach(app => { %>
                            <div class="group flex items-center justify-between p-5 border border-stone-100 rounded-3xl hover:bg-stone-50 transition hover:shadow-md">
                                <div class="flex items-center gap-5">
                                    <div class="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 text-xl group-hover:scale-110 transition">
                                        <i class="fas fa-file-medical"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-stone-900 text-lg"><%= app.service || 'Прием врача' %></div>
                                        <div class="text-xs text-stone-400 mt-1 flex items-center gap-2">
                                            <i class="far fa-calendar"></i> <%= new Date(app.createdAt).toLocaleDateString() %>
                                            <span class="w-1 h-1 bg-stone-300 rounded-full"></span>
                                            <i class="far fa-clock"></i> <%= new Date(app.createdAt).toLocaleTimeString().slice(0,5) %>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide
                                        <%= app.status === 'done' ? 'bg-green-100 text-green-600' : 
                                           app.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : 
                                           app.status === 'canceled' ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500' %>">
                                        <%= app.status === 'new' ? 'Обработка' : 
                                           app.status === 'confirmed' ? 'Подтверждено' : 
                                           app.status === 'done' ? 'Завершено' : 'Отмена' %>
                                    </span>
                                </div>
                            </div>
                            <% }) %>
                        </div>
                    <% } else { %>
                        <div class="flex flex-col items-center justify-center h-64 text-center">
                            <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 text-3xl mb-4">
                                <i class="fas fa-folder-open"></i>
                            </div>
                            <p class="text-stone-400 font-medium">История посещений пуста</p>
                            <button onclick="document.querySelector('[x-data]').__x.$data.modalOpen = true" class="mt-4 text-rose-500 font-bold hover:underline text-sm uppercase tracking-widest">Записаться на прием</button>
                        </div>
                    <% } %>
                </div>
            </div>
        </div>
    </div>
</div>
<%- include('partials/footer') %>
`;
fs.writeFileSync(profilePath, profileContent);
console.log('✅ Личный кабинет восстановлен (настройки, история, аватар).');


// 3. ДОБАВЛЯЕМ ФОРМУ ОТЗЫВОВ (С БОКОВОЙ ПАНЕЛЬЮ)
// Чтобы пользователь мог писать отзывы
const reviewsPath = path.join('views', 'reviews.ejs');
const reviewsContent = `
<%- include('partials/header') %>
<div class="py-24 max-w-7xl mx-auto px-4">
    <div class="grid md:grid-cols-12 gap-12">
        <!-- Sidebar Form -->
        <div class="md:col-span-4 h-fit sticky top-24">
            <div class="bg-white p-8 rounded-[40px] shadow-xl border border-stone-100 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -z-0"></div>
                <h2 class="text-3xl font-serif italic mb-6 relative z-10 text-stone-900">Ваш опыт</h2>
                
                <% if(user) { %>
                <form action="/reviews/add" method="POST" class="space-y-4 relative z-10" x-data="{ rating: 5, hasPhoto: false }">
                    <!-- Rating -->
                    <div class="flex gap-2 text-2xl text-stone-200 cursor-pointer mb-4">
                        <template x-for="i in 5">
                            <i class="fas fa-star transition hover:scale-110 hover:text-yellow-400" :class="i <= rating ? 'text-yellow-400' : ''" @click="rating = i"></i>
                        </template>
                        <input type="hidden" name="rating" :value="rating">
                    </div>
                    
                    <textarea name="text" rows="4" placeholder="Расскажите, как прошел прием..." class="w-full bg-stone-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-rose-500 resize-none outline-none transition text-sm"></textarea>
                    
                    <!-- Fake Photo Upload -->
                    <div class="relative">
                        <button type="button" @click="hasPhoto = !hasPhoto" class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition">
                            <i class="fas fa-camera"></i> <span x-text="hasPhoto ? 'Убрать фото' : 'Добавить фото'"></span>
                        </button>
                        <input x-show="hasPhoto" x-transition type="text" name="photoUrl" placeholder="Ссылка на фото (URL)" class="w-full mt-2 bg-stone-50 border-0 rounded-xl px-4 py-2 text-xs outline-none">
                    </div>

                    <button class="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-rose-500 transition shadow-lg text-xs">Опубликовать</button>
                </form>
                <% } else { %>
                    <div class="text-center py-8 relative z-10">
                         <div class="text-4xl text-stone-200 mb-4"><i class="fas fa-lock"></i></div>
                         <p class="text-stone-500 mb-4 text-sm">Войдите, чтобы поделиться мнением.</p>
                         <a href="/auth/login" class="text-rose-500 font-bold border-b border-rose-500 pb-1 hover:text-rose-600 transition">Войти в аккаунт</a>
                    </div>
                <% } %>
            </div>
        </div>

        <!-- Reviews Masonry -->
        <div class="md:col-span-8 space-y-8">
            <% if(reviews.length > 0) { %>
                <% reviews.forEach(r => { %>
                <div class="bg-white p-8 rounded-[32px] shadow-sm border border-stone-100 flex gap-6 reveal group hover:border-rose-200 transition">
                    <div class="flex-shrink-0">
                         <img src="<%= r.userAvatar || 'https://ui-avatars.com/api/?name='+r.userName %>" class="w-14 h-14 rounded-full object-cover shadow-sm">
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="font-bold text-lg text-stone-900"><%= r.userName %></h3>
                                <div class="text-xs text-stone-400"><%= new Date(r.createdAt).toLocaleDateString() %></div>
                            </div>
                            <div class="flex text-yellow-400 text-xs">
                                <% for(let i=0; i<r.rating; i++) { %> <i class="fas fa-star"></i> <% } %>
                            </div>
                        </div>
                        <p class="text-stone-600 leading-relaxed mb-4"><%= r.text %></p>
                        <% if(r.photoUrl) { %>
                            <div class="h-64 rounded-2xl overflow-hidden shadow-sm mt-4 relative group/img">
                                <img src="<%= r.photoUrl %>" class="w-full h-full object-cover transform group-hover/img:scale-105 transition duration-700">
                            </div>
                        <% } %>
                    </div>
                </div>
                <% }) %>
            <% } else { %>
                <div class="text-center py-20 bg-stone-50 rounded-[40px]">
                    <p class="text-stone-400">Пока отзывов нет. Станьте первым!</p>
                </div>
            <% } %>
        </div>
    </div>
</div>
<%- include('partials/footer') %>
`;
fs.writeFileSync(reviewsPath, reviewsContent);
console.log('✅ Страница отзывов обновлена (форма добавления + список).');

console.log('----------------------------------------------------');
console.log('✨ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО! ✨');
console.log('Не забудь перезапустить сервер: npm run dev');
console.log('----------------------------------------------------');