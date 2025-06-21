const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // Your existing API Key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

async function fetchTrendingAnime() {
    let allResults = [];

    // Fetch from multiple pages to get more anime (max 3 pages for demo)
    for (let page = 1; page <= 3; page++) {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
        const data = await res.json();
        const filtered = data.results.filter(item =>
            item.original_language === 'ja' && item.genre_ids.includes(16) // Assuming 16 is the genre ID for Animation
        );
        allResults = allResults.concat(filtered);
    }
    return allResults;
}

function displayBanner(item) {
    document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => showDetails(item);
        container.appendChild(img);
    });
}

function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
    changeServer(); // Set initial video source
    document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
    const server = document.getElementById('server').value;
    // Ensure currentItem is defined and has media_type
    const type = currentItem && currentItem.media_type === "movie" ? "movie" : "tv";
    let embedURL = "";

    if (server === "vidsrc.cc") {
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    } else if (server === "vidsrc.me") {
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    } else if (server === "player.videasy.net") {
        embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    }

    document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = ''; // Stop video playback
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-input').value = ''; // Clear search input
}

async function searchTMDB() {
    const query = document.getElementById('search-input').value;
    if (!query.trim()) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();

    const container = document.getElementById('search-results');
    container.innerHTML = '';
    data.results.forEach(item => {
        // Only display if it's a movie or TV show and has a poster
        if ((item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path) {
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.onclick = () => {
                closeSearchModal();
                showDetails(item);
            };
            container.appendChild(img);
        }
    });
}

// Initialize the page with trending content
async function init() {
    try {
        const movies = await fetchTrending('movie');
        const tvShows = await fetchTrending('tv');
        const anime = await fetchTrendingAnime();

        // Display a random movie as the banner
        if (movies.length > 0) {
            displayBanner(movies[Math.floor(Math.random() * movies.length)]);
        }

        displayList(movies, 'movies-list');
        displayList(tvShows, 'tvshows-list');
        displayList(anime, 'anime-list');
    } catch (error) {
        console.error("Error initializing data:", error);
        // You might want to display a user-friendly error message on the page
    }
}

// Run init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
