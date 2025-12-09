‚pimport { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAqtoFiXLTJNcmQPTpOr5QAidCT07v7HGA",
    authDomain: "rikotaikendo-651fe.firebaseapp.com",
    projectId: "rikotaikendo-651fe",
    storageBucket: "rikotaikendo-651fe.firebasestorage.app",
    messagingSenderId: "990392564150",
    appId: "1:990392564150:web:9ad1034884e341491c2917"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PASSWORD = '123';

document.addEventListener('DOMContentLoaded', () => {
    // Page specific loading logic
    const path = window.location.pathname;

    // Auth Check for Admin Page
    if (path.includes('admin.html')) {
        checkAuth();
        setupAdminTabs();
        loadAdminData();
    }

    if (document.getElementById('news-container')) loadNews();
    if (document.getElementById('news-page-container')) loadNews();
    if (document.getElementById('results-body')) loadResults();
    if (document.getElementById('members-container')) loadMembers();
    if (document.getElementById('schedule-container')) loadSchedule();

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Toggle icon 
            if (nav.classList.contains('active')) {
                menuToggle.innerHTML = 'âœ•';
            } else {
                menuToggle.innerHTML = 'â˜°';
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.innerHTML = 'â˜°';
            });
        });
    }
});

/* --- Authentication --- */
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdmin', 'true');
        window.location.href = 'admin.html';
    } else {
        alert('ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ãŒé–“é•ã£ã¦ã„ã¾ã™');
    }
}

function checkAuth() {
    if (!sessionStorage.getItem('isAdmin')) {
        window.location.href = 'login.html';
    }
}

window.logout = function () {
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

/* --- Data Loading (Firestore) --- */

async function loadNews() {
    try {
        const q = query(collection(db, "news"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const news = [];
        querySnapshot.forEach((doc) => {
            news.push({ id: doc.id, ...doc.data() });
        });

        // Top Page
        const topContainer = document.getElementById('news-container');
        if (topContainer) {
            topContainer.className = 'news-list-top';
            if (news.length === 0) {
                topContainer.innerHTML = '<p style="text-align:center">ãƒ‹ãƒ¥ãƒ¼ã‚¹ã¯ã¾ã ã‚ã‚Šã¾ã›ã‚“</p>';
            } else {
                topContainer.innerHTML = news.slice(0, 3).map(item => `
                    <div class="card news-card-top" onclick="location.href='news.html'">
                        <span class="news-date">${formatDate(item.date)}</span>
                        <h3>${item.title}</h3>
                        <p class="news-preview-text">${item.content}</p>
                    </div>
                `).join('');
            }
        }

        // News Page
        const pageContainer = document.getElementById('news-page-container');
        if (pageContainer) {
            if (news.length === 0) {
                pageContainer.innerHTML = '<p style="text-align:center">ãƒ‹ãƒ¥ãƒ¼ã‚¹ã¯ã¾ã ã‚ã‚Šã¾ã›ã‚“ã€‚</p>';
            } else {
                pageContainer.innerHTML = news.map(item => `
                    <div class="card news-card-full">
                        <span class="news-date">${formatDate(item.date)}</span>
                        <h3 style="margin-bottom:10px; color:var(--primary-color);">${item.title}</h3>
                        <div class="news-content-wrapper">
                            <p class="news-content-short">${item.content}</p>
                            <div class="news-content-full">${item.content}</div>
                        </div>
                        <button class="read-more-btn" onclick="toggleNews(this)">ç¶šãã‚’èª­ã‚€</button>
                    </div>
                `).join('');
            }
        }

        // Admin List
        const adminList = document.getElementById('list-news');
        if (adminList) {
            adminList.innerHTML = news.map(i => `
                <li>${i.date} : ${i.title} <button onclick="deleteItem('news', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">å‰Šé™¤</button></li>
            `).join('');
        }

    } catch (e) {
        console.error("Error loading news: ", e);
    }
}

window.toggleNews = function (btn) {
    const card = btn.closest('.news-card-full');
    card.classList.toggle('expanded');
    btn.textContent = card.classList.contains('expanded') ? 'é–‰ã˜ã‚‹' : 'ç¶šãã‚’èª­ã‚€';
}

async function loadResults() {
    try {
        const q = query(collection(db, "results"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });

        const container = document.getElementById('results-body');
        if (!container) return;

        // Admin Preview
        if (container.classList.contains('admin-preview')) {
            container.innerHTML = results.map(match => `
                <tr>
                    <td>${match.date}</td>
                    <td>${match.tournament}</td>
                    <td><button onclick="deleteItem('results', '${match.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">å‰Šé™¤</button></td>
                </tr>
            `).join('');
            return;
        }

        // Public View
        if (results.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center">è©¦åˆçµæœã¯ã¾ã ã‚ã‚Šã¾ã›ã‚“</td></tr>';
            return;
        }

        container.innerHTML = results.map(match => {
            const resultClass = match.result === 'å‹' || match.result === 'Top 3' || match.result === 'ä¸Šä½å…¥è³' ? 'win' : 'loss';
            return `
                <tr>
                    <td>${formatDate(match.date)}</td>
                    <td>${match.tournament}</td>
                    <td style="font-size: 0.9rem; color: #555;">${match.detail || '-'}</td>
                    <td>${match.opponent}</td>
                    <td class="win-loss ${resultClass}">${match.result}</td>
                    <td>${match.score}</td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        console.error("Error loading results: ", e);
    }
}

async function loadMembers() {
    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        const members = [];
        querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() });
        });

        const container = document.getElementById('members-container');
        if (container) {
            const officers = members.filter(m => m.group === 'officer');
            const others = members.filter(m => m.group !== 'officer');

            // Custom sort might be needed here, simple load for now
            let html = '';
            if (officers.length > 0) {
                html += `<h2 class="section-title">å¹¹éƒ¨ãƒ»4å¹´ç”Ÿ</h2><div class="card-grid">`;
                html += officers.map(m => createMemberCard(m)).join('');
                html += `</div>`;
            }
            if (others.length > 0) {
                html += `<div style="margin-top:40px;"></div><h2 class="section-title">éƒ¨å“¡</h2><div class="card-grid">`;
                html += others.map(m => createMemberCard(m)).join('');
                html += `</div>`;
            }
            if (members.length === 0) html = '<p style="text-align:center">éƒ¨å“¡æƒ…å ±ã¯ã¾ã ã‚ã‚Šã¾ã›ã‚“</p>';
            container.innerHTML = html;
        }

        // Admin List
        const adminList = document.getElementById('list-members');
        if (adminList) {
            adminList.innerHTML = members.map(i => `
                <li>${i.name} (${i.role}) <button onclick="deleteItem('members', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">å‰Šé™¤</button></li>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

function createMemberCard(m) {
    return `
        <div class="card member-card">
            <div class="member-img">${m.role[0] || 'éƒ¨'}</div>
            <div class="member-role">${m.role}</div>
            <h3 class="member-name">${m.name}</h3>
            <p>${m.dept}</p>
            <p style="font-size:0.9rem; color:#666;">${m.comment || ''}</p>
        </div>
    `;
}

async function loadSchedule() {
    try {
        const querySnapshot = await getDocs(collection(db, "schedule"));
        const schedule = [];
        querySnapshot.forEach((doc) => {
            schedule.push({ id: doc.id, ...doc.data() });
        });

        // Sort
        const monthOrder = { '4æœˆ': 1, '5æœˆ': 2, '6æœˆ': 3, '7æœˆ': 4, '8æœˆ': 5, '9æœˆ': 6, '10æœˆ': 7, '11æœˆ': 8, '12æœˆ': 9, '1æœˆ': 10, '2æœˆ': 11, '3æœˆ': 12 };
        schedule.sort((a, b) => (monthOrder[a.month] || 99) - (monthOrder[b.month] || 99));

        const container = document.getElementById('schedule-container');
        if (container) {
            container.innerHTML = schedule.map(item => {
                let tagInfo = { class: 'tag-other', text: 'è¡Œäº‹' };
                if (item.type === 'match') tagInfo = { class: 'tag-match', text: 'è©¦åˆ' };
                if (item.type === 'camp') tagInfo = { class: 'tag-camp', text: 'åˆå®¿' };

                return `
                    <li class="schedule-item">
                        <span class="schedule-date">${item.month}</span>
                        <span class="schedule-event">${item.event}</span>
                        <span class="schedule-tag ${tagInfo.class}">${tagInfo.text}</span>
                    </li>
                `;
            }).join('');
        }

        // Admin List
        const adminList = document.getElementById('list-schedule');
        if (adminList) {
            adminList.innerHTML = schedule.map(i => `
                <li>${i.month} : ${i.event} <button onclick="deleteItem('schedule', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">å‰Šé™¤</button></li>
            `).join('');
        }

    } catch (e) {
        console.error(e);
    }
}


/* --- Admin Functions --- */

function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // UI Update
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show Section
            document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
            document.getElementById(`section-${tab.dataset.target}`).style.display = 'block';
        });
    });

    // Attach form listeners
    document.getElementById('form-news').addEventListener('submit', (e) => addItem(e, 'news'));
    document.getElementById('form-result').addEventListener('submit', (e) => addItem(e, 'results'));
    document.getElementById('form-member').addEventListener('submit', (e) => addItem(e, 'members'));
    document.getElementById('form-schedule').addEventListener('submit', (e) => addItem(e, 'schedule'));
}

function loadAdminData() {
    loadNews();
    loadResults();
    loadMembers();
    loadSchedule();
}

async function addItem(e, collectionName) {
    e.preventDefault();
    const form = e.target;
    const newItem = {};

    // Collect data
    Array.from(form.elements).forEach(el => {
        if (el.name) newItem[el.name] = el.value;
    });

    try {
        await addDoc(collection(db, collectionName), newItem);
        alert('è¿½åŠ ã—ã¾ã—ãŸ');
        form.reset();
        loadAdminData(); // Reload all
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("ã‚¨ãƒ©ãƒ¼ãŒç™ºç”Ÿã—ã¾ã—ãŸ");
    }
}

window.deleteItem = async function (collectionName, id) {
    if (!confirm('æœ¬å½“ã«å‰Šé™¤ã—ã¾ã™ã‹ï¼Ÿ')) return;

    try {
        await deleteDoc(doc(db, collectionName, id));
        alert("å‰Šé™¤ã—ã¾ã—ãŸ");
        if (collectionName === 'news') loadNews();
        if (collectionName === 'results') loadResults();
        if (collectionName === 'members') loadMembers();
        if (collectionName === 'schedule') loadSchedule();
    } catch (error) {
        console.error("Error removing document: ", error);
        alert("å‰Šé™¤ã«å¤±æ•—ã—ã¾ã—ãŸ");
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
        return new Date(dateString).toLocaleDateString('ja-JP', options);
    } catch (e) {
        return dateString;
    }
}
´*cascade08´Õ *cascade08Õ“ *cascade08“¥*cascade08¥§ *cascade08§¨ *cascade08¨®*cascade08®Â *cascade08ÂÃ *cascade08ÃÌ*cascade08ÌÎ *cascade08ÎÒ*cascade08ÒÓ *cascade08Ó*cascade08‘ *cascade08‘š*cascade08š› *cascade08›²*cascade08²³ *cascade08³Ã*cascade08ÃÄ *cascade08ÄÌ*cascade08ÌÍ *cascade08Íë*cascade08ëî *cascade08îÿ*cascade08ÿƒ *cascade08ƒŠ*cascade08Š‹ *cascade08‹£*cascade08£¤ *cascade08¤Ë*cascade08ËÌ *cascade08Ìİ *cascade08İÿ *cascade08ÿÿ*cascade08ÿ¢	 *cascade08¢	ç
 *cascade08ç
è
 *cascade08è
²*cascade08²³ *cascade08³Ğ*cascade08ĞÑ *cascade08ÑÕ*cascade08ÕÖ *cascade08Ö×*cascade08×Ù *cascade08Ùâ*cascade08âã *cascade08ãü *cascade08ü‘*cascade08‘˜ *cascade08˜š *cascade08š› *cascade08›*cascade08Ÿ *cascade08Ÿ­*cascade08­® *cascade08®±*cascade08±² *cascade08²³*cascade08³´ *cascade08´¾*cascade08¾¿ *cascade08¿À*cascade08ÀÅ *cascade08ÅÈ*cascade08ÈÊ *cascade08ÊÍ*cascade08ÍÎ *cascade08ÎÑ*cascade08ÑÒ *cascade08Òâ*cascade08âã *cascade08ãä*cascade08äå *cascade08åè*cascade08èô *cascade08ôõ*cascade08õö *cascade08öù*cascade08ùû *cascade08ûü*cascade08ü˜ *cascade08˜™*cascade08™š *cascade08šŸ*cascade08Ÿ  *cascade08 ß*cascade08ßà *cascade08àá*cascade08áâ *cascade08âä*cascade08äæ *cascade08æğ*cascade08ğñ *cascade08ñ‚*cascade08‚‹ *cascade08‹*cascade08‘ *cascade08‘¢*cascade08¢¤ *cascade08¤§*cascade08§¬ *cascade08¬¯*cascade08¯° *cascade08°¿*cascade08¿Ì *cascade08Ì¯*cascade08¯° *cascade08°±*cascade08±² *cascade08²´*cascade08´¶ *cascade08¶À*cascade08ÀÁ *cascade08ÁÆ*cascade08ÆÇ *cascade08ÇÜ*cascade08Üİ *cascade08İë*cascade08ëì *cascade08ìõ*cascade08õö *cascade08öø*cascade08øù *cascade08ù‹ *cascade08‹›*cascade08›  *cascade08 ¡ *cascade08¡¤ *cascade08¤¯*cascade08¯° *cascade08°´*cascade08´µ *cascade08µ»*cascade08»¼ *cascade08¼½*cascade08½¾ *cascade08¾Ç*cascade08ÇÉ *cascade08ÉÊ*cascade08ÊË *cascade08ËÍ*cascade08ÍÏ *cascade08ÏĞ*cascade08ĞÑ *cascade08ÑÕ*cascade08ÕÖ *cascade08Öé*cascade08éê *cascade08êò*cascade08òô *cascade08ôú*cascade08úû *cascade08û‹ *cascade08‹*cascade08“ *cascade08“” *cascade08”˜ *cascade08˜™*cascade08™š *cascade08š*cascade08  *cascade08 £*cascade08£® *cascade08®´*cascade08´À *cascade08ÀÁ *cascade08ÁÂ*cascade08ÂÃ *cascade08ÃÄ*cascade08ÄÅ *cascade08ÅÊ *cascade08ÊÏ *cascade08ÏŞ*cascade08Şã*cascade08ãä *cascade08äş*cascade08ş‚*cascade08‚…*cascade08…† *cascade08†‡*cascade08‡ˆ *cascade08ˆ‰*cascade08‰Š *cascade08Š*cascade08 *cascade08*cascade08‘ *cascade08‘’ *cascade08’ª*cascade08ª« *cascade08«²*cascade08²³ *cascade08³Á*cascade08ÁÂ *cascade08ÂÅ*cascade08ÅÈ *cascade08ÈÌ*cascade08ÌÍ *cascade08ÍÛ*cascade08ÛÜ *cascade08Üà*cascade08àå *cascade08åæ*cascade08æğ *cascade08ğö*cascade08ö÷ *cascade08÷ı*cascade08ış *cascade08ş*cascade08‚ *cascade08‚ƒ*cascade08ƒ„ *cascade08„… *cascade08…‰*cascade08‰‹ *cascade08‹*cascade08“ *cascade08“¢*cascade08¢£ *cascade08£¤ *cascade08¤¥ *cascade08¥­*cascade08­® *cascade08®À*cascade08ÀÄ *cascade08ÄÆ*cascade08ÆÈ *cascade08ÈÓ*cascade08ÓÔ *cascade08ÔÕ *cascade08ÕÖ*cascade08ÖÚ *cascade08ÚÜ*cascade08Üà*cascade08àñ *cascade08ñõ *cascade08õù*cascade08ùü *cascade08üº *cascade08º¾*cascade08¾ß *cascade08ßã*cascade08ãŒ *cascade08Œ*cascade08‘ *cascade08‘œ*cascade08œ *cascade08*cascade08Ÿ *cascade08Ÿ¤*cascade08¤¥ *cascade08¥©*cascade08©ª *cascade08ªÎ*cascade08ÎĞ *cascade08ĞÑ*cascade08ÑÒ *cascade08Òà*cascade08àá *cascade08áä*cascade08äå *cascade08åí*cascade08íî *cascade08îö*cascade08ö÷ *cascade08÷®*cascade08®¯ *cascade08¯¶*cascade08¶¸ *cascade08¸»*cascade08»½ *cascade08½¿*cascade08¿Ç *cascade08ÇÍ*cascade08ÍÓ *cascade08Óë *cascade08ë÷*cascade08÷† *cascade08†*cascade08’*cascade08’ª *cascade08ªÜ*cascade08Üà *cascade08àá*cascade08áí *cascade08íñ *cascade08ñø*cascade08øÁ *cascade08ÁÉ*cascade08ÉÙ *cascade08ÙÚ *cascade08Úß*cascade08ßá *cascade08áâ*cascade08âî *cascade08îò*cascade08òù*cascade08ùû *cascade08û•*cascade08•¤ *cascade08¤¥ *cascade08¥« *cascade08«³*cascade08³À *cascade08ÀÏ *cascade08Ï×*cascade08×å *cascade08åí*cascade08íô *cascade08ôı*cascade08ıÿ *cascade08ÿ… *cascade08…   *cascade08   *cascade08 —  *cascade08— › *cascade08› ¹  *cascade08¹ º  *cascade08º Ô *cascade08Ô Õ  *cascade08Õ æ  *cascade08æ è *cascade08è ì  *cascade08ì î *cascade08î „! *cascade08„!ˆ!*cascade08ˆ!™! *cascade08™!š! *cascade08š!ª! *cascade08ª!®!*cascade08®!Û! *cascade08Û!Ü! *cascade08Ü!­" *cascade08­"²"*cascade08²"³" *cascade08³"µ"*cascade08µ"õ" *cascade08õ"÷"*cascade08÷"ƒ# *cascade08ƒ#‰#*cascade08‰#¬# *cascade08¬#´#*cascade08´#Û# *cascade08Û#Ş# *cascade08Ş#é#*cascade08é#ò# *cascade08ò#ó#*cascade08ó#÷# *cascade08÷#ı# *cascade08ı#ş#*cascade08ş#$ *cascade08$•$*cascade08•$ $ *cascade08 $¢$ *cascade08¢$¶$*cascade08¶$·$ *cascade08·$Ê$*cascade08Ê$Ë$ *cascade08Ë$â$*cascade08â$í$ *cascade08í$õ$ *cascade08õ$ı$*cascade08ı$¡% *cascade08¡%¢%*cascade08¢%¶% *cascade08¶%½%*cascade08½%ğ% *cascade08ğ%ø%*cascade08ø%º& *cascade08º&Æ& *cascade08Æ&Ò& *cascade08Ò&Ú&*cascade08Ú&â& *cascade08â&ê&*cascade08ê&Ù' *cascade08Ù'á'*cascade08á'é' *cascade08é'ï'*cascade08ï'÷' *cascade08÷'ù'*cascade08ù'ƒ( *cascade08ƒ(…( *cascade08…(‹( *cascade08‹(“(*cascade08“(–( *cascade08–((*cascade08(£( *cascade08£(„)*cascade08„)…) *cascade08…)õ)*cascade08õ)ö) *cascade08ö)ü)*cascade08ü)ş) *cascade08ş)ˆ**cascade08ˆ*‰* *cascade08‰*š**cascade08š*›* *cascade08›*°**cascade08°*±* *cascade08±*²**cascade08²*³* *cascade08³*Ü**cascade08Ü*İ* *cascade08İ*ˆ,*cascade08ˆ,’, *cascade08’,,*cascade08,- *cascade08-‚-*cascade08‚-…- *cascade08…-”-*cascade08”-•- *cascade08•-–-*cascade08–-º- *cascade08º-ÿ-*cascade08ÿ-ˆ. *cascade08ˆ.‹.*cascade08‹.Œ. *cascade08Œ..*cascade08.’. *cascade08’.™.*cascade08™.š. *cascade08š.›.*cascade08›.œ. *cascade08œ.£.*cascade08£.¤. *cascade08¤.­.*cascade08­.®. *cascade08®.¯.*cascade08¯.±. *cascade08±.¼.*cascade08¼.½. *cascade08½.Å.*cascade08Å.Æ. *cascade08Æ.Í.*cascade08Í.Î. *cascade08Î.Ñ.*cascade08Ñ.Ò. *cascade08Ò.Ú.*cascade08Ú.á. *cascade08á.ã.*cascade08ã.ä. *cascade08ä.è.*cascade08è.é. *cascade08é.í.*cascade08í.î. *cascade08î.ø.*cascade08ø.ù. *cascade08ù.Œ/*cascade08Œ/–/ *cascade08–/—/*cascade08—/™/ *cascade08™/š/*cascade08š/›/ *cascade08›//*cascade08// *cascade08/¡/*cascade08¡/¢/ *cascade08¢/£/*cascade08£/¦/ *cascade08¦/¨/*cascade08¨/¯/ *cascade08¯/´/*cascade08´/µ/ *cascade08µ/¹/*cascade08¹/º/ *cascade08º/¿/*cascade08¿/À/ *cascade08À/Â/*cascade08Â/Ã/ *cascade08Ã/Å/*cascade08Å/Æ/ *cascade08Æ/Ê/*cascade08Ê/Ë/ *cascade08Ë/â/*cascade08â/è/ *cascade08è/‡0*cascade08‡0ˆ0 *cascade08ˆ0Š0 *cascade08Š00*cascade0800 *cascade080¢0*cascade08¢0¬0 *cascade08¬0µ0 *cascade08µ0Ş0*cascade08Ş0ß0 *cascade08ß0à0*cascade08à0æ0 *cascade08æ0è0*cascade08è0ê0 *cascade08ê0ì0*cascade08ì0î0 *cascade08î0ğ0*cascade08ğ0ñ0 *cascade08ñ0ò0*cascade08ò0ô0 *cascade08ô0ö0*cascade08ö0÷0 *cascade08÷0ø0 *cascade08ø0ı0 *cascade08ı0ş0*cascade08ş0…1 *cascade08…1‰1*cascade08‰11 *cascade081Ÿ1 *cascade08Ÿ1£1*cascade08£1İ1 *cascade08İ1à1*cascade08à1è1 *cascade08è1é1*cascade08é1ÿ1 *cascade08ÿ1£2 *cascade08£2§2*cascade08§2­2 *cascade08­2¯2*cascade08¯2¿2 *cascade08¿2Á2*cascade08Á2Ù2 *cascade08Ù2İ2*cascade08İ2‹3 *cascade08‹33*cascade0833 *cascade083Ÿ3*cascade08Ÿ3¿3 *cascade08¿3À3 *cascade08À3Ç3 *cascade08Ç3È3 *cascade08È3Ê3 *cascade08Ê3Ë3*cascade08Ë3Ö3 *cascade08Ö3×3*cascade08×3ï3 *cascade08ï3ğ3 *cascade08ğ3½4*cascade08½4Ã4 *cascade08Ã4Ë4 *cascade08Ë4Ï4*cascade08Ï4Ö4 *cascade08Ö4Ú4*cascade08Ú4ğ4 *cascade08ğ4ô4*cascade08ô4‰5 *cascade08‰55*cascade085’5 *cascade08’5–5*cascade08–5¨5 *cascade08¨5®5 *cascade08®5²5*cascade08²5Ï5 *cascade08Ï5Ó5*cascade08Ó5ƒ6 *cascade08ƒ6„6*cascade08„6Ú6 *cascade08Ú6Ş6*cascade08Ş6ç6 *cascade08ç6é6*cascade08é6í6 *cascade08í6ï6*cascade08ï6ô6 *cascade08ô6ø6*cascade08ø6ü6 *cascade08ü6’7*cascade08’7š7 *cascade08š7›7*cascade08›7œ7 *cascade08œ77*cascade087ª7 *cascade08ª7­7*cascade08­7µ7 *cascade08µ7¶7*cascade08¶7ı7 *cascade08ı7 8*cascade08 8»8 *cascade08»8¿8*cascade08¿8Ç8*cascade08Ç8Ò8 *cascade08Ò8Ô8*cascade08Ô8Õ8 *cascade08Õ8Ù8*cascade08Ù8İ8*cascade08İ8ß8 *cascade08ß8ã8*cascade08ã8ä8*cascade08ä8ğ8 *cascade08ğ8ó8*cascade08ó8—9 *cascade08—9™9*cascade08™9¥9 *cascade08¥9©9*cascade08©9«9*cascade08«9Á9 *cascade08Á9É9 *cascade08É9Í9*cascade08Í9: *cascade08:¦: *cascade08¦:¨:*cascade08¨:ª:*cascade08ª:¶: *cascade08¶:¸:*cascade08¸:º:*cascade08º:Ö: *cascade08Ö:Ú:*cascade08Ú:Ş:*cascade08Ş:¤; *cascade08¤;¥;*cascade08¥;¨;*cascade08¨;´; *cascade08´;µ;*cascade08µ;¸;*cascade08¸;Ù; *cascade08Ù;İ; *cascade08İ;á;*cascade08á;è; *cascade08è;é;*cascade08é;ñ; *cascade08ñ;ô;*cascade08ô;ø; *cascade08ø;ü;*cascade08ü;€< *cascade08€<< *cascade08<”<*cascade08”<•< *cascade08•<¡<*cascade08¡<£< *cascade08£<Ş<*cascade08Ş<à< *cascade08à<ë<*cascade08ë<…= *cascade08…=ˆ= *cascade08ˆ=Š= *cascade08Š=—=*cascade08—=›= *cascade08›=œ=*cascade08œ== *cascade08= =*cascade08 =¢= *cascade08¢=«=*cascade08«=®= *cascade08®=²=*cascade08²=³= *cascade08³=´=*cascade08´=·= *cascade08·=¾=*cascade08¾=¿= *cascade08¿=À=*cascade08À=Á= *cascade08Á=Â=*cascade08Â=Ã= *cascade08Ã=Æ=*cascade08Æ=Ç= *cascade08Ç=Ì=*cascade08Ì=Ó= *cascade08Ó=Õ=*cascade08Õ=Ù= *cascade08Ù=İ=*cascade08İ=á= *cascade08á=ñ= *cascade08ñ=ƒ>*cascade08ƒ>„> *cascade08„>†>*cascade08†>‡> *cascade08‡>>*cascade08>‘> *cascade08‘>±>*cascade08±>³> *cascade08³>¸>*cascade08¸>¹> *cascade08¹>Ë>*cascade08Ë>Í> *cascade08Í>Ï>*cascade08Ï>Ğ> *cascade08Ğ>õ>*cascade08õ>ö> *cascade08ö>ø>*cascade08ø>ù> *cascade08ù>ÿ>*cascade08ÿ>€? *cascade08€?ˆ?*cascade08ˆ?‰? *cascade08‰?‹?*cascade08‹?? *cascade08?‘?*cascade08‘?•? *cascade08•?™?*cascade08™?š? *cascade08š?œ?*cascade08œ?£? *cascade08£?­?*cascade08­?®? *cascade08®?²? *cascade08²?º? *cascade08º?»?*cascade08»?¼? *cascade08¼?¿?*cascade08¿?À? *cascade08À?Æ?*cascade08Æ?Ç? *cascade08Ç?È?*cascade08È?É? *cascade08É?Ê?*cascade08Ê?Ğ? *cascade08Ğ?Ø?*cascade08Ø?š@ *cascade08š@¢@*cascade08¢@à@ *cascade08à@®A*cascade08®AÂA *cascade08ÂAÊA*cascade08ÊAêA *cascade08êAñA*cascade08ñAùA *cascade08ùAúA*cascade08úAÕB *cascade08ÕBİB*cascade08İB—C *cascade08—CC*cascade08C¥C *cascade08¥C§C*cascade08§C¾C *cascade08¾CÆC*cascade08ÆCÉC *cascade08ÉCÑC*cascade08ÑCïC *cascade08ïC÷C*cascade08÷CìD *cascade08ìDïD*cascade08ïD÷D *cascade08÷DüD*cascade08üD¼E *cascade08¼EÄE*cascade08ÄE×E *cascade08×EßE*cascade08ßEæE *cascade08æEÛF*cascade08ÛFİF *cascade08İFåF*cascade08åF†G *cascade08†GÚJ*cascade08ÚJèM *cascade08èMîM*cascade08îMN *cascade08N›N*cascade08›NŸN *cascade08ŸN N*cascade08 N¡N *cascade08¡N¤N*cascade08¤N¦N *cascade08¦N¯N*cascade08¯N²N *cascade08²N¶N*cascade08¶N·N *cascade08·N¸N*cascade08¸N»N *cascade08»NÃN*cascade08ÃNÅN *cascade08ÅNÉN*cascade08ÉNÊN *cascade08ÊNËN*cascade08ËNÌN *cascade08ÌNĞN*cascade08ĞNØN *cascade08ØNÚN*cascade08ÚNŞN *cascade08ŞNâN*cascade08âN÷N *cascade08÷N‰O*cascade08‰OŠO *cascade08ŠO‹O*cascade08‹OŒO *cascade08ŒOO*cascade08OO *cascade08OO*cascade08O‘O *cascade08‘O“O*cascade08“O•O *cascade08•O–O*cascade08–O—O *cascade08—O™O*cascade08™OšO *cascade08šO›O*cascade08›OO *cascade08O²O*cascade08²OºO *cascade08ºOÚO*cascade08ÚOÛO *cascade08ÛOİO*cascade08İOŞO *cascade08ŞOáO*cascade08áOâO *cascade08âOèO*cascade08èOéO *cascade08éOëO*cascade08ëOğO *cascade08ğOóO*cascade08óO÷O *cascade08÷OøO*cascade08øOûO *cascade08ûOüO*cascade08üOÿO *cascade08ÿOP*cascade08P«Q *cascade08«Q¯Q*cascade08¯QËQ *cascade08ËQÌQ*cascade08ÌQåQ *cascade08åQæQ*cascade08æQçQ *cascade08çQèQ*cascade08èQéQ *cascade08éQêQ*cascade08êQƒR *cascade08ƒR…R*cascade08…RˆR *cascade08ˆRŠR*cascade08ŠR’R *cascade08’R–R*cascade08–R—R *cascade08—RšR*cascade08šR›R *cascade08›RœR*cascade08œRR *cascade08R¡R*cascade08¡R¢R *cascade08¢R£R*cascade08£R¤R *cascade08¤R¨R*cascade08¨R©R *cascade08©RÑR*cascade08ÑRØR *cascade08ØRéR*cascade08éRêR *cascade08êRìR*cascade08ìRîR *cascade08îRöR*cascade08öR¨S *cascade08¨SªS*cascade08ªS²S *cascade08²S¸S*cascade08¸SïS *cascade08ïSğS*cascade08ğSøS *cascade08øSÿS*cascade08ÿSÍT *cascade08ÍTÎT*cascade08ÎTÖT *cascade08ÖTİT*cascade08İT«U *cascade08«U¬U*cascade08¬U´U *cascade08´U»U*cascade08»UÅU *cascade08ÅUÍU*cascade08ÍU…V *cascade08…VV*cascade08V¿V *cascade08¿VÆV*cascade08ÆVÖV *cascade08ÖV×V*cascade08×VŠW *cascade08ŠW’W*cascade08’WæW *cascade08æWìW*cascade08ìWøW *cascade08øWúW*cascade08úWX *cascade08X‡X*cascade08‡XX *cascade08X‘X*cascade08‘X™X *cascade08™X¡X*cascade08¡X­X *cascade08­Xˆ\*cascade08ˆ\\ *cascade08\‘\*cascade08‘\ªd *cascade08ªd«d*cascade08«d®d *cascade08®d±d*cascade08±dÔd *cascade08ÔdÕd*cascade08Õdâd *cascade08âdãd*cascade08ãdåd *cascade08ådæd*cascade08ædğd *cascade08ğdñd*cascade08ñd÷d *cascade08÷død*cascade08ødûd *cascade08ûdüd*cascade08üd„e *cascade08„e…e*cascade08…e†e *cascade08†e‡e*cascade08‡ee *cascade08ee*cascade08e’e *cascade08’e”e*cascade08”e™e *cascade08™eše*cascade08šeùf *cascade08ùfıf*cascade08ıfƒg *cascade08ƒg‘g*cascade08‘g“g *cascade08“g–g*cascade08–g—g *cascade08—gšg*cascade08šg›g *cascade08›gœg*cascade08œgg *cascade08gg*cascade08gŸg *cascade08Ÿg©g*cascade08©gªg *cascade08ªg«g*cascade08«g¬g *cascade08¬g®g*cascade08®g¯g *cascade08¯g°g*cascade08°g±g *cascade08±g²g*cascade08²gµg *cascade08µg¸g*cascade08¸g¹g *cascade08¹g»g*cascade08»g¿g *cascade08¿gÃg*cascade08Ãgég *cascade08égíg*cascade08ígüg *cascade08ügÿg*cascade08ÿgƒh *cascade08ƒh„h*cascade08„h”h *cascade08”h¢h*cascade08¢h¤h *cascade08¤h¨h*cascade08¨h©h *cascade08©h¹h*cascade08¹h»h *cascade08»hóh*cascade08óhõh *cascade08õhi*cascade08i‚i *cascade08‚i´i*cascade08´i¶i *cascade08¶iºi*cascade08ºiÄi *cascade08ÄiÈi*cascade08ÈiÉi *cascade08ÉiÑi*cascade08ÑiÒi *cascade08ÒiÓi*cascade08ÓiÔi *cascade08ÔiÛi*cascade08ÛiÜi *cascade08Üiäi*cascade08äi²j *cascade08²j´j*cascade08´jµj *cascade08µj¸j*cascade08¸jºj *cascade08ºjÀj*cascade08ÀjÁj *cascade08ÁjÂj*cascade08ÂjÃj *cascade08ÃjÄj*cascade08ÄjÅj *cascade08ÅjÇj*cascade08ÇjÈj *cascade08ÈjÉj*cascade08ÉjÌj *cascade08ÌjÏj*cascade08ÏjĞj *cascade08ĞjŞj*cascade08Şjßj *cascade08ßjàj*cascade08àjáj *cascade08ájãj*cascade08ãjäj *cascade08äjåj*cascade08åjæj *cascade08æjêj*cascade08êjõj *cascade08õj÷j*cascade08÷jûj *cascade08ûjüj*cascade08üjıj *cascade08ıj–k*cascade08–k—k *cascade08—kœk*cascade08œkk *cascade08k§k*cascade08§k¨k *cascade08¨k­k*cascade08­k®k *cascade08®k¯k*cascade08¯k²k *cascade08²k³k*cascade08³k´k *cascade08´k¿k*cascade08¿kÀk *cascade08ÀkÅk*cascade08ÅkÉk *cascade08ÉkËk*cascade08ËkÏk *cascade08ÏkÖk*cascade08Ök×k *cascade08×kÚk*cascade08ÚkÛk *cascade08Ûkàk*cascade08àkák *cascade08ákík*cascade08íkïk *cascade08ïkôk*cascade08ôkök *cascade08ökøk*cascade08økùk *cascade08ùkık*cascade08ıkşk *cascade08şk“l*cascade08“l”l *cascade08”l•l*cascade08•l–l *cascade08–lœl*cascade08œll *cascade08l£l*cascade08£l¤l *cascade08¤l©l*cascade08©lªl *cascade08ªl®l*cascade08®l°l *cascade08°l²l*cascade08²l³l *cascade08³lµl*cascade08µl¶l *cascade08¶l·l*cascade08·l¸l *cascade08¸lÅl*cascade08ÅlÇl *cascade08ÇlÈl*cascade08ÈlÉl *cascade08ÉlÏl*cascade08ÏlĞl *cascade08ĞlÔl*cascade08ÔlÕl *cascade08Õlæl*cascade08ælçl *cascade08çlõl*cascade08õlùl *cascade08ùlm*cascade08m”m *cascade08”mm*cascade08mm *cascade08m°m*cascade08°m±m *cascade08±m¶m*cascade08¶m·m *cascade08·mºm*cascade08ºm»m *cascade08»m¼m*cascade08¼m½m *cascade08½mÔm*cascade08ÔmÕm *cascade08ÕmØm*cascade08ØmÚm *cascade08Úm÷m*cascade08÷mùm *cascade08ùmûm *cascade08ûmÿm*cascade08ÿm‚n *cascade08‚nƒn*cascade08ƒn…n *cascade08…n‡n*cascade08‡n÷n *cascade08÷n†o*cascade08†oÇo *cascade08Çoıo*cascade08ıo‚p *cascade082Cfile:///c:/Users/Naohiro%20Tanabe/.gemini/keio_kendo_site/script.js