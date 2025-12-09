import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
                menuToggle.innerHTML = '✕';
            } else {
                menuToggle.innerHTML = '☰';
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.innerHTML = '☰';
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
        alert('パスワードが間違っています');
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
                topContainer.innerHTML = '<p style="text-align:center">ニュースはまだありません</p>';
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
                pageContainer.innerHTML = '<p style="text-align:center">ニュースはまだありません。</p>';
            } else {
                pageContainer.innerHTML = news.map(item => `
                    <div class="card news-card-full">
                        <span class="news-date">${formatDate(item.date)}</span>
                        <h3 style="margin-bottom:10px; color:var(--primary-color);">${item.title}</h3>
                        <div class="news-content-wrapper">
                            <p class="news-content-short">${item.content}</p>
                            <div class="news-content-full">${item.content}</div>
                        </div>
                        <button class="read-more-btn" onclick="toggleNews(this)">続きを読む</button>
                    </div>
                `).join('');
            }
        }

        // Admin List
        const adminList = document.getElementById('list-news');
        if (adminList) {
            adminList.innerHTML = news.map(i => `
                <li>${i.date} : ${i.title} <button onclick="deleteItem('news', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">削除</button></li>
            `).join('');
        }

    } catch (e) {
        console.error("Error loading news: ", e);
    }
}

window.toggleNews = function (btn) {
    const card = btn.closest('.news-card-full');
    card.classList.toggle('expanded');
    btn.textContent = card.classList.contains('expanded') ? '閉じる' : '続きを読む';
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
                    <td><button onclick="deleteItem('results', '${match.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">削除</button></td>
                </tr>
            `).join('');
            return;
        }

        // Public View
        if (results.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center">試合結果はまだありません</td></tr>';
            return;
        }

        container.innerHTML = results.map(match => {
            const resultClass = match.result === '勝' || match.result === 'Top 3' || match.result === '上位入賞' ? 'win' : 'loss';
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
                html += `<h2 class="section-title">幹部・4年生</h2><div class="card-grid">`;
                html += officers.map(m => createMemberCard(m)).join('');
                html += `</div>`;
            }
            if (others.length > 0) {
                html += `<div style="margin-top:40px;"></div><h2 class="section-title">部員</h2><div class="card-grid">`;
                html += others.map(m => createMemberCard(m)).join('');
                html += `</div>`;
            }
            if (members.length === 0) html = '<p style="text-align:center">部員情報はまだありません</p>';
            container.innerHTML = html;
        }

        // Admin List
        const adminList = document.getElementById('list-members');
        if (adminList) {
            adminList.innerHTML = members.map(i => `
                <li>${i.name} (${i.role}) <button onclick="deleteItem('members', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">削除</button></li>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

function createMemberCard(m) {
    return `
        <div class="card member-card">
            <div class="member-img">${m.role[0] || '部'}</div>
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
        const monthOrder = { '4月': 1, '5月': 2, '6月': 3, '7月': 4, '8月': 5, '9月': 6, '10月': 7, '11月': 8, '12月': 9, '1月': 10, '2月': 11, '3月': 12 };
        schedule.sort((a, b) => (monthOrder[a.month] || 99) - (monthOrder[b.month] || 99));

        const container = document.getElementById('schedule-container');
        if (container) {
            container.innerHTML = schedule.map(item => {
                let tagInfo = { class: 'tag-other', text: '行事' };
                if (item.type === 'match') tagInfo = { class: 'tag-match', text: '試合' };
                if (item.type === 'camp') tagInfo = { class: 'tag-camp', text: '合宿' };

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
                <li>${i.month} : ${i.event} <button onclick="deleteItem('schedule', '${i.id}')" style="background:red;color:white;border:none;padding:2px 5px;cursor:pointer;">削除</button></li>
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
        alert('追加しました');
        form.reset();
        loadAdminData(); // Reload all
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("エラーが発生しました");
    }
}

window.deleteItem = async function (collectionName, id) {
    if (!confirm('本当に削除しますか？')) return;

    try {
        await deleteDoc(doc(db, collectionName, id));
        alert("削除しました");
        if (collectionName === 'news') loadNews();
        if (collectionName === 'results') loadResults();
        if (collectionName === 'members') loadMembers();
        if (collectionName === 'schedule') loadSchedule();
    } catch (error) {
        console.error("Error removing document: ", error);
        alert("削除に失敗しました");
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
