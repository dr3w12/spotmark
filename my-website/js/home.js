const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    let currentItem;

    // Add episode display for TV and Anime
async function fetchEpisodes(type, id) {
  let endpoint = '';
  if (type === 'tv') {
    endpoint = `/tv/${id}/episodes?api_key=${API_KEY}`;
  } else if (type === 'anime') {
    endpoint = `/anime/${id}/episodes?api_key=${API_KEY}`;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`);
  const data = await res.json();
  return data.results || [];
}

// Function to display episodes
function displayEpisodes(episodes, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear the container first
  episodes.forEach(episode => {
    const episodeItem = document.createElement('div');
    episodeItem.classList.add('episode-item');
    episodeItem.innerHTML = `
      <h4>Episode ${episode.episode_number}: ${episode.name}</h4>
      <p>${episode.overview}</p>
    `;
    container.appendChild(episodeItem);
  });
}

// Modified init function to display episodes for tv and anime
async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  // Fetch episodes for TV and Anime
  const tvShowEpisodes = await Promise.all(tvShows.map(tvShow => fetchEpisodes('tv', tvShow.id)));
  const animeEpisodes = await Promise.all(anime.map(animeShow => fetchEpisodes('anime', animeShow.id)));

  // Display movie banner and lists
  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');

  // Display TV Shows with episodes
  tvShows.forEach((tvShow, index) => {
    const episodes = tvShowEpisodes[index];
    displayList([tvShow], 'tvshows-list'); // Display TV Show
    displayEpisodes(episodes, `tv-show-${tvShow.id}-episodes`); // Display Episodes
  });

  // Display Anime Shows with episodes
  anime.forEach((animeShow, index) => {
    const episodes = animeEpisodes[index];
    displayList([animeShow], 'anime-list'); // Display Anime Show
    displayEpisodes(episodes, `anime-show-${animeShow.id}-episodes`); // Display Episodes
  });
}

// Call the init function to load everything
init();
