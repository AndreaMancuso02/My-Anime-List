const container = document.getElementById('watchlist');
const modal = document.getElementById('animeModal');
const closeBtn = document.querySelector('.close-button');

async function loadWatchlist() {
    try {
        const response = await fetch('watchlist.json');
        const data = await response.json();
        data.forEach(anime => renderCard(anime));
    } catch (error) {
        console.error("Errore nel caricamento del database:", error);
    }
}

function renderCard(anime) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${anime.immagine}" alt="${anime.titolo}">
        <h2>${anime.titolo}</h2>
    `;

    card.addEventListener('click', () => {
        openModal(anime);
    });

    container.appendChild(card);
}

function openModal(anime) {
    document.getElementById('modal-title').innerText = anime.titolo;
    document.getElementById('modal-img').src = anime.immagine;
    document.getElementById('modal-trama').innerText = anime.trama;
    
    const infoEpisodi = anime.stagioni > 1 
        ? `📺 ${anime.episodi} episodi (${anime.stagioni} stagioni)` 
        : `📺 ${anime.episodi} episodi`;
    document.getElementById('modal-stats').innerText = infoEpisodi;

    const genresHtml = anime.generi.map(g => `<span class="genre-tag">${g}</span>`).join('');
    document.getElementById('modal-genres').innerHTML = genresHtml;

    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Impedisce lo scroll della pagina sotto
}

// Chiusura al click sulla X
closeBtn.onclick = () => {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
};

// Chiusura cliccando fuori dal popup
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
};

loadWatchlist();