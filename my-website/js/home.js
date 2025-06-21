const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
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
            item.original_language === 'ja' && item.genre_ids.includes(16)
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

// NEW FUNCTION: Fetch episodes for a TV show
async function fetchEpisodes(tvId, seasonNumber) {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
    const data = await res.json();
    return data.episodes;
}

// NEW FUNCTION: Display seasons and episodes
async function displayEpisodes(item) {
    const episodeContainer = document.getElementById('episode-container');
    episodeContainer.innerHTML = '<h4>Seasons & Episodes:</h4>'; // Clear previous episodes

    const seasons = item.seasons; // TMDB item for TV shows includes season data

    if (!seasons || seasons.length === 0) {
        episodeContainer.innerHTML += '<p>No episode information available.</p>';
        return;
    }

    for (const season of seasons) {
        if (season.season_number === 0 && season.episode_count === 0) {
            // Skip "Specials" season if it has no episodes listed or if you don't want to show it
            continue;
        }

        const seasonDiv = document.createElement('div');
        seasonDiv.classList.add('season-section');

        const seasonTitle = document.createElement('h5');
        seasonTitle.textContent = `Season ${season.season_number} (${season.episode_count} episodes)`;
        seasonDiv.appendChild(seasonTitle);

        const episodeList = document.createElement('ul');
        episodeList.classList.add('episode-list');
        seasonDiv.appendChild(episodeList);

        // Fetch episodes for the current season
        const episodes = await fetchEpisodes(item.id, season.season_number);

        if (episodes && episodes.length > 0) {
            episodes.forEach(episode => {
                const episodeLi = document.createElement('li');
                episodeLi.innerHTML = `<strong>E${episode.episode_number}:</strong> ${episode.name}`;
                episodeLi.classList.add('episode-item');
                // When an episode is clicked, update the video player to that specific episode
                episodeLi.onclick = () => {
                    const type = currentItem.media_type === "movie" ? "movie" : "tv";
                    const server = document.getElementById('server').value; // Get current server
                    let embedURL = "";

                    if (server === "vidsrc.cc") {
                        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}/${season.season_number}/${episode.episode_number}`;
                    } else if (server === "vidsrc.me") {
                        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}&season=${season.season_number}&episode=${episode.episode_number}`;
                    } else if (server === "player.videasy.net") {
                        // videasy.net might not support direct episode linking in the same way,
                        // you might need to test or adapt this. For now, assuming standard tmdb format.
                        embedURL = `https://player.videasy.net/${type}/${currentItem.id}/${season.season_number}/${episode.episode_number}`;
                    }
                    document.getElementById('modal-video').src = embedURL;
                };
                episodeList.appendChild(episodeLi);
            });
        } else {
            const noEpisodesLi = document.createElement('li');
            noEpisodesLi.textContent = 'No episodes found for this season.';
            episodeList.appendChild(noEpisodesLi);
        }
        episodeContainer.appendChild(seasonDiv);
    }
    // Ensure episode container is visible for TV shows and hidden for movies
    episodeContainer.style.display = item.media_type === "tv" ? "block" : "none";
}

async function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));

    // Conditional display for episodes or just the movie player
    if (item.media_type === "tv") {
        await displayEpisodes(item); // Fetch and display episodes
        // Set the video player to load the first available episode or default to season 1, episode 1
        // You might want to refine this to auto-play the first episode or prompt the user.
        // For now, let's just make sure the player is ready to be updated by clicking an episode.
        document.getElementById('modal-video').src = ''; // Clear source until an episode is selected
        document.getElementById('episode-container').style.display = 'block'; // Make sure the container is visible
        document.getElementById('server-selection').style.display = 'none'; // Hide server selection for TV shows initially, as episodes will control
    } else {
        // It's a movie, so just set the player and hide episode controls
        changeServer();
        document.getElementById('episode-container').style.display = 'none';
        document.getElementById('server-selection').style.display = 'block'; // Show server selection for movies
    }

    document.getElementById('modal').style.display = 'flex';
}


function changeServer() {
    const server = document.getElementById('server').value;
    const type = currentItem.media_type === "movie" ? "movie" : "tv";
    let embedURL = "";

    // For TV shows, the server selection might change the base, but episode click will append details
    if (type === "movie") {
        if (server === "vidsrc.cc") {
            embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
        } else if (server === "vidsrc.me") {
            embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
        } else if (server === "player.videasy.net") {
            embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
        }
        document.getElementById('modal-video').src = embedURL;
    }
    // For TV series, the episode clicks will handle the URL.
    // If you want a default episode to load when the modal opens, you'd set it here,
    // but typically users will select the episode from the list.
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = '';
    document.getElementById('episode-container').innerHTML = ''; // Clear episodes when closing
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
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
        if (!item.poster_path) return;
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => {
            closeSearchModal();
            showDetails(item);
        };
        container.appendChild(img);
    });
}

async function init() {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();

    displayBanner(movies[Math.floor(Math.random() * movies.length)]);
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
}

init();
