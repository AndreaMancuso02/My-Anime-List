const firebaseConfig = {
    apiKey: "AIzaSyB-bwzhKX5njitRUXaeON4ShlI4OgbZqxw",
    authDomain: "myanimelist-5e91a.firebaseapp.com",
    projectId: "myanimelist-5e91a",
    storageBucket: "myanimelist-5e91a.firebasestorage.app",
    messagingSenderId: "96444715392",
    appId: "1:96444715392:web:95f6bfb6cad9fb31fc3165"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let allAnime = [];
let userAnimeData = {};
let isAlphabetical = false;
let currentProfileFilter = 'all';

// PUNTO 3: Funzione Toast (Notifiche a scomparsa)
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast glass-effect';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function toggleMobileMenu() { document.getElementById("mobileDropdown").classList.toggle("show"); }

function showSection(s) {
    document.getElementById('explore-section').style.display = (s === 'explore') ? 'block' : 'none';
    document.getElementById('profile-section').style.display = (s === 'profile') ? 'block' : 'none';
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.id.includes(s)));
    if(s === 'profile') updateProfileUI();
}

auth.onAuthStateChanged(user => {
    const btn = document.getElementById('authBtn');
    const pDk = document.getElementById('btn-profile');
    const pMb = document.getElementById('btn-profile-mobile');
    if (user) {
        btn.innerText = "Logout";
        btn.onclick = () => auth.signOut();
        pDk.style.display = "block"; pMb.style.display = "block";
        loadUserData(user.uid);
    } else {
        btn.innerText = "Login";
        btn.onclick = () => document.getElementById('authModal').style.display = 'flex';
        pDk.style.display = "none"; pMb.style.display = "none";
        userAnimeData = {};
        applyFiltersAndRender();
    }
});

async function loadUserData(uid) {
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) userAnimeData = doc.data().animeData || {};
    applyFiltersAndRender();
    updateProfileUI();
}

async function updateStatus(titolo, status) {
    const user = auth.currentUser;
    if (!user) {
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    const oldStatus = userAnimeData[titolo];
    userAnimeData[titolo] = (userAnimeData[titolo] === status) ? null : status;
    
    // Feedback visivo via Toast
    if (userAnimeData[titolo]) {
        showToast(`${titolo} aggiunto a ${status}`);
    } else {
        showToast(`${titolo} rimosso dalla lista`);
    }

    if (!userAnimeData[titolo]) delete userAnimeData[titolo];
    await db.collection("users").doc(user.uid).set({ animeData: userAnimeData });
    applyFiltersAndRender();
    updateProfileUI();
}

function renderGrid(containerId, data) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    data.forEach(a => {
        const s = userAnimeData[a.titolo];
        const card = document.createElement('div');
        card.className = 'card';
        const isInCorso = a.episodi && a.episodi.toString().includes('+');
        
        // PUNTO 6: Lazy Loading immagini + Fade-in
        card.innerHTML = `
            ${isInCorso ? '<div class="status-badge">In Corso</div>' : ''}
            <div class="card-actions">
                <button class="btn-action ${s==='completato'?'visto':''}" onclick="event.stopPropagation(); updateStatus('${a.titolo}', 'completato')"><i class="fas fa-check"></i></button>
                <button class="btn-action ${s==='in-corso'?'corso':''}" onclick="event.stopPropagation(); updateStatus('${a.titolo}', 'in-corso')"><i class="fas fa-play"></i></button>
                <button class="btn-action ${s==='da-vedere'?'piano':''}" onclick="event.stopPropagation(); updateStatus('${a.titolo}', 'da-vedere')"><i class="fas fa-plus"></i></button>
            </div>
            <img src="${a.immagine}" loading="lazy" onload="this.classList.add('loaded')">
            <h2>${a.titolo}</h2>`;
        
        card.onclick = () => openAnimeModal(a);
        container.appendChild(card);
    });
}

function updateProfileUI() {
    const myAnime = allAnime.filter(a => userAnimeData[a.titolo]);
    const w = myAnime.filter(a => userAnimeData[a.titolo] === 'in-corso');
    const c = myAnime.filter(a => userAnimeData[a.titolo] === 'completato');
    const p = myAnime.filter(a => userAnimeData[a.titolo] === 'da-vedere');

    renderGrid('grid-watching', w); renderGrid('grid-completed', c); renderGrid('grid-plan', p);
    
    document.getElementById('watching-container').style.display = (currentProfileFilter==='all'||currentProfileFilter==='in-corso') && w.length ? 'block' : 'none';
    document.getElementById('completed-container').style.display = (currentProfileFilter==='all'||currentProfileFilter==='completato') && c.length ? 'block' : 'none';
    document.getElementById('plan-container').style.display = (currentProfileFilter==='all'||currentProfileFilter==='da-vedere') && p.length ? 'block' : 'none';

    document.getElementById('stat-total').innerText = Object.keys(userAnimeData).length;
    document.getElementById('stat-comp').innerText = c.length;
    document.getElementById('stat-prog').innerText = w.length;
    document.getElementById('stat-plan').innerText = p.length;
}

function filterProfile(f) {
    currentProfileFilter = f;
    document.querySelectorAll('.stats-list li').forEach(li => li.classList.remove('active'));
    document.getElementById(`li-${f}`).classList.add('active');
    updateProfileUI();
}

function openAnimeModal(a) {
    document.getElementById('modal-title').innerText = a.titolo;
    document.getElementById('modal-img').src = a.immagine;
    document.getElementById('modal-trama').innerText = a.trama;
    const numStagioni = a.stagioni || 1;
    const labelStagione = numStagioni === 1 ? "Stagione" : "Stagioni";
    document.getElementById('modal-stats').innerText = `${a.episodi} Episodi • ${numStagioni} ${labelStagione}`;
    document.getElementById('modal-commento').innerText = a.commento || "Nessun commento.";
    document.getElementById('modal-genres').innerHTML = a.generi.map(g => `<span class="tag-badge">${g}</span>`).join('');
    document.getElementById('animeModal').style.display = 'flex';
}

function closeAnimeModal() { document.getElementById('animeModal').style.display = 'none'; }
function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }
function closeAnimeModalOutside(e) { if(e.target.classList.contains('modal-overlay')) e.target.style.display = 'none'; }

function applyFiltersAndRender() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const activeCat = document.querySelector('.category-item.active')?.dataset.genre || 'Tutti';
    let filtered = allAnime.filter(a => (activeCat === 'Tutti' || a.generi.includes(activeCat)) && a.titolo.toLowerCase().includes(term));
    if (isAlphabetical) filtered.sort((a, b) => a.titolo.localeCompare(b.titolo));
    renderGrid('watchlist', filtered);
}

document.getElementById('sortBtn').onclick = function() { isAlphabetical = !isAlphabetical; applyFiltersAndRender(); };
document.getElementById('searchInput').oninput = applyFiltersAndRender;
document.getElementById('nextBtn').onclick = () => document.getElementById('filterContainer').scrollBy({left: 300, behavior: 'smooth'});
document.getElementById('prevBtn').onclick = () => document.getElementById('filterContainer').scrollBy({left: -300, behavior: 'smooth'});

async function init() {
    const res = await fetch('watchlist.json');
    allAnime = await res.json();
    const genres = ['Tutti', ...new Set(allAnime.flatMap(a => a.generi))];
    const container = document.getElementById('filterContainer');
    genres.forEach(g => {
        const btn = document.createElement('div');
        btn.className = 'category-item' + (g === 'Tutti' ? ' active' : '');
        btn.innerText = g; btn.dataset.genre = g;
        btn.onclick = () => { document.querySelectorAll('.category-item').forEach(b => b.classList.remove('active')); btn.classList.add('active'); applyFiltersAndRender(); };
        container.appendChild(btn);
    });
    applyFiltersAndRender();
}
init();

let isLoginMode = true;
function toggleAuthMode() { isLoginMode = !isLoginMode; document.getElementById('auth-title').innerText = isLoginMode ? "Accedi" : "Registrati"; }
async function handleAuth() {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    try {
        if (isLoginMode) {
            await auth.signInWithEmailAndPassword(e, p);
            showToast("Accesso effettuato!");
        } else {
            await auth.createUserWithEmailAndPassword(e, p);
            showToast("Registrazione completata!");
        }
        document.getElementById('authModal').style.display = 'none';
    } catch(err) { showToast("Errore: " + err.message); }
}