document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let diaries = [];
    const STORAGE_KEY = 'diaryApp_data';

    // モチベーションが上がる名言リスト
    const quotes = [
        "小さな一歩が、偉大な旅の始まり。",
        "今日という日は、残りの人生の最初の日。",
        "できるかできないかではなく、やるかやらないか。",
        "未来を予言する最良の方法は、それを創ることだ。",
        "影があるということは、近くに光があるということ。",
        "昨日の自分を少しでも超えれば、それは大成功。",
        "行動しなければ疑いと恐怖が生まれ、行動すれば自信と勇気が生まれる。",
        "あなたの時間は限られている。だから他人の人生を生きて無駄にしてはいけない。",
        "七転び八起き。",
        "成功とは、情熱を失わずに失敗を重ねていく能力のことだ。"
    ];

    // --- DOM Elements ---
    const diaryListEl = document.getElementById('diary-list');
    const fabAddBtn = document.getElementById('fab-add');
    const modal = document.getElementById('modal');
    const modalCloseBtn = document.getElementById('modal-close');
    const diaryForm = document.getElementById('diary-form');
    const modalTitle = document.getElementById('modal-title');
    const entryIdInput = document.getElementById('entry-id');
    const entryDateInput = document.getElementById('entry-date');
    const entryTitleInput = document.getElementById('entry-title');
    const entryContentInput = document.getElementById('entry-content');
    const btnCancel = document.getElementById('btn-cancel');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const subtitleEl = document.querySelector('.subtitle');

    // --- Initialization ---
    loadDiaries();
    renderDiaries();
    setupTheme();
    setRandomQuote();

    // --- Event Listeners ---
    fabAddBtn.addEventListener('click', openAddModal);
    modalCloseBtn.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    diaryForm.addEventListener('submit', handleFormSubmit);
    themeToggleBtn.addEventListener('click', toggleTheme);

    // モーダルの外側クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // --- Functions ---

    function loadDiaries() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            diaries = JSON.parse(data);
            // 日付順（新しい順）にソート
            diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
    }

    function saveDiaries() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
        renderDiaries();
    }

    function renderDiaries() {
        diaryListEl.innerHTML = '';

        if (diaries.length === 0) {
            diaryListEl.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded empty-icon">menu_book</span>
                    <p>まだ日記がありません。<br>右下のボタンから書いてみましょう。</p>
                </div>`;
            return;
        }

        diaries.forEach(diary => {
            const card = document.createElement('div');
            card.className = 'diary-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-date">${formatDate(diary.date)}</span>
                    <div class="card-actions">
                        <button class="action-btn btn-edit" data-id="${diary.id}" aria-label="編集">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="action-btn btn-delete" data-id="${diary.id}" aria-label="削除">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
                <h3 class="card-title">${escapeHtml(diary.title)}</h3>
                <p class="card-content">${escapeHtml(diary.content)}</p>
            `;

            // イベントリスナーを動的に追加
            const editBtn = card.querySelector('.btn-edit');
            const deleteBtn = card.querySelector('.btn-delete');

            editBtn.addEventListener('click', (e) => {
                e.preventDefault(); // 親要素への波及防止
                openEditModal(diary.id);
            });
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteDiary(diary.id);
            });

            // カードクリックで全表示（簡易的な詳細表示）
            card.addEventListener('click', (e) => {
                // アクションボタンクリック時は無視
                if (e.target.closest('.action-btn')) return;

                // toggle class for expand (CSSで line-clamp を解除するクラスを作るのがベストだが、ここでは簡易的に)
                const content = card.querySelector('.card-content');
                if (content.style.webkitLineClamp) {
                    content.style.webkitLineClamp = '';
                    content.style.display = 'block';
                } else {
                    // 初期状態に戻すのはCSS依存だと難しいので今回は簡易実装
                    // 本格的にはクラス着脱推奨
                }
            });

            diaryListEl.appendChild(card);
        });
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        const id = entryIdInput.value;
        const date = entryDateInput.value;
        const title = entryTitleInput.value;
        const content = entryContentInput.value;

        if (id) {
            // 編集
            const index = diaries.findIndex(d => d.id === id);
            if (index !== -1) {
                diaries[index] = { ...diaries[index], date, title, content };
            }
        } else {
            // 新規作成
            const newDiary = {
                id: Date.now().toString(),
                date,
                title,
                content
            };
            diaries.unshift(newDiary); // 先頭に追加
            // ソートし直す
            diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        saveDiaries();
        closeModal();
    }

    function deleteDiary(id) {
        if (confirm('本当にこの日記を削除しますか？')) {
            diaries = diaries.filter(d => d.id !== id);
            saveDiaries();
        }
    }

    // --- Modal Control ---

    function openAddModal() {
        modalTitle.textContent = '日記を書く';
        entryIdInput.value = '';
        entryDateInput.value = new Date().toISOString().split('T')[0]; // 今日
        entryTitleInput.value = '';
        entryContentInput.value = '';

        modal.classList.remove('hidden');
        entryTitleInput.focus();
    }

    function openEditModal(id) {
        const diary = diaries.find(d => d.id === id);
        if (!diary) return;

        modalTitle.textContent = '日記を編集';
        entryIdInput.value = diary.id;
        entryDateInput.value = diary.date;
        entryTitleInput.value = diary.title;
        entryContentInput.value = diary.content;

        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // --- Theme Control ---
    function setupTheme() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.querySelector('span').textContent = 'light_mode';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggleBtn.querySelector('span').textContent = isDark ? 'light_mode' : 'dark_mode';
    }

    function setRandomQuote() {
        if (!subtitleEl) return;
        const randomIndex = Math.floor(Math.random() * quotes.length);

        // フェードインアニメーションのために一度透明にするなどの処理を入れても良いですが、
        // ここではシンプルにテキスト置換を行います。
        subtitleEl.style.opacity = '0';
        setTimeout(() => {
            subtitleEl.textContent = quotes[randomIndex];
            subtitleEl.style.opacity = '1';
        }, 200);

        // CSS側で transition: opacity 0.5s; などを .subtitle に当てるとより綺麗ですが、
        // JSだけでも動作するようにセット
        subtitleEl.style.transition = 'opacity 0.5s ease';
    }

    // --- Utilities ---

    function formatDate(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        // 日本語形式のフォーマット
        return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
});
