import './style.css'

// Configuration & State
const STORAGE_KEY_API = 'safetube_api_key';
const STORAGE_KEY_CHANNELS = 'safetube_channels';

// Default channels if none exist
const DEFAULT_CHANNELS = [
  { id: 'UCbCmjCuTUZos6Inko4u57UQ', name: 'Cocomelon - Nursery Rhymes' },
  { id: 'UC2h-ucSvsjDMg8gqE2KoVyg', name: 'Super Simple Songs' },
  { id: 'UXI_4T5eMWe8s_8jATfD_25g', name: 'Pinkfong Baby Shark - Kids\' Songs & Stories' }
];

// Mock Data for Demo Mode (When no API Key is present)
const MOCK_VIDEOS = [
  {
    id: 'WRVsOCh907o',
    title: 'Baby Shark Dance | #babyshark Most Viewed Video | Animal Songs | PINKFONG Songs for Children',
    thumbnail: 'https://img.youtube.com/vi/WRVsOCh907o/maxresdefault.jpg',
    channelTitle: 'Pinkfong Baby Shark - Kids\' Songs & Stories',
    publishedAt: new Date().toISOString()
  },
  {
    id: 'yCjJyiqpAuU',
    title: 'Phonics Song with TWO Words - A For Apple - ABC Alphabet Songs with Sounds for Children',
    thumbnail: 'https://img.youtube.com/vi/yCjJyiqpAuU/maxresdefault.jpg',
    channelTitle: 'ChuChu TV',
    publishedAt: new Date().toISOString()
  },
  {
    id: '_6HzoUcx3eo',
    title: 'Twinkle Twinkle Little Star',
    thumbnail: 'https://img.youtube.com/vi/_6HzoUcx3eo/maxresdefault.jpg',
    channelTitle: 'Super Simple Songs',
    publishedAt: new Date().toISOString()
  },
  {
    id: '7otAJa3jui8',
    title: 'Bath Song | CoComelon Nursery Rhymes & Kids Songs',
    thumbnail: 'https://img.youtube.com/vi/7otAJa3jui8/maxresdefault.jpg',
    channelTitle: 'Cocomelon - Nursery Rhymes',
    publishedAt: new Date().toISOString()
  },
  {
    id: 'V_-not4fA6U',
    title: 'Walking In The Jungle | Super Simple Songs',
    thumbnail: 'https://img.youtube.com/vi/V_-not4fA6U/maxresdefault.jpg',
    channelTitle: 'Super Simple Songs',
    publishedAt: new Date().toISOString()
  },
];

let state = {
  apiKey: localStorage.getItem(STORAGE_KEY_API) || '',
  channels: JSON.parse(localStorage.getItem(STORAGE_KEY_CHANNELS)) || DEFAULT_CHANNELS,
  videos: [],
  player: null
};

// DOM Elements
const videoContainer = document.getElementById('video-container');
const settingsModal = document.getElementById('settings-modal');
const playerModal = document.getElementById('player-modal');
const gateModal = document.getElementById('gate-modal');
const apiKeyInput = document.getElementById('api-key-input');
const channelList = document.getElementById('channel-list');
const apiStatus = document.getElementById('api-status');
const channelSearchInput = document.getElementById('channel-search-input');
const searchResultsDropdown = document.getElementById('search-results-dropdown');

// --- Initialization ---
function init() {
  renderChannelList();

  if (!state.apiKey) {
    // Show Mock Data initially for immediate "Wow" factor
    state.videos = MOCK_VIDEOS;
    renderVideos();
    apiStatus.textContent = 'Demo Mode: Using sample videos. Add API Key for real content.';
    apiStatus.style.color = 'orange';
  } else {
    fetchAllVideos();
  }

  setupEventListeners();
}

// --- Video Fetching Logic ---
async function fetchAllVideos() {
  if (!state.apiKey) return;

  videoContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Updating your safe channel list...</p>
    </div>
  `;

  let checkVideos = [];

  try {
    // 1. Get Uploads Playlist ID for each channel
    // We use search queries for simplicity in this V1, but ideally we'd use channel->contentDetails->relatedPlaylists->uploads
    // For simplicity and "latest" validation, we'll iterate channels.

    const promises = state.channels.map(channel => fetchChannelVideos(channel.id));
    const results = await Promise.all(promises);

    // Flatten and sort
    checkVideos = results.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    state.videos = checkVideos;
    renderVideos();
    apiStatus.textContent = 'Connected! Videos updated.';
    apiStatus.style.color = '#4ecdc4'; // Teal

  } catch (error) {
    console.error('Error fetching videos:', error);
    apiStatus.textContent = 'Error fetching videos. Check access or quota.';
    apiStatus.style.color = '#ff6b6b';
    // Fallback to what we have or show error
    videoContainer.innerHTML = `<p style="text-align:center; padding: 2rem;">😕 Change API Key or check internet.</p>`;
  }
}

async function fetchChannelVideos(channelId) {
  // Using 'search' endpoint: simple but costs 100 quota per call.
  // Better: 'channels' -> uploads playlist ID -> 'playlistItems'. Cost: 1 + 1 = 2 quota.

  // Method: Get Uploads Playlist ID
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${state.apiKey}`;

  try {
    const chRes = await fetch(channelUrl);
    const chData = await chRes.json();

    if (!chData.items || chData.items.length === 0) return [];

    const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;

    // Get Videos from Playlist
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${state.apiKey}`;
    const plRes = await fetch(plUrl);
    const plData = await plRes.json();

    if (!plData.items) return [];

    return plData.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));

  } catch (e) {
    console.error(`Failed to fetch for ${channelId}`, e);
    return [];
  }
}

// --- Channel Search Logic ---
let searchDebounce;

async function searchChannels(query) {
  if (!state.apiKey) {
    alert('Please enter a valid API Key first.');
    return;
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=5&key=${state.apiKey}`;

  try {
    const res = await fetch(searchUrl);
    const data = await res.json();

    renderSearchResults(data.items || []);
  } catch (error) {
    console.error('Search error:', error);
  }
}

function renderSearchResults(items) {
  if (items.length === 0) {
    searchResultsDropdown.innerHTML = '<li style="padding:10px;">No channels found.</li>';
    searchResultsDropdown.classList.remove('hidden');
    return;
  }

  searchResultsDropdown.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'search-result-item';
    li.onclick = () => addChannelFromSearch(item);

    const thumb = item.snippet.thumbnails.default?.url;

    li.innerHTML = `
      <img src="${thumb}" class="search-avatar" />
      <div class="search-info">
        <span class="search-name">${item.snippet.channelTitle}</span>
        <span class="search-sub">${item.snippet.description.substring(0, 30)}...</span>
      </div>
    `;

    searchResultsDropdown.appendChild(li);
  });

  searchResultsDropdown.classList.remove('hidden');
}

function addChannelFromSearch(item) {
  const newChannel = {
    id: item.snippet.channelId,
    name: item.snippet.channelTitle
  };

  // Check if exists
  if (state.channels.some(c => c.id === newChannel.id)) {
    alert('Channel already added!');
    return;
  }

  state.channels.push(newChannel);
  localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(state.channels));
  renderChannelList();

  // Clear search
  channelSearchInput.value = '';
  searchResultsDropdown.classList.add('hidden');

  // Optionally update videos
  fetchAllVideos();
}


// --- Rendering ---
function renderVideos() {
  videoContainer.innerHTML = '';

  if (state.videos.length === 0) {
    videoContainer.innerHTML = '<p style="text-align:center; width: 100%;">No videos found. Check channel settings.</p>';
    return;
  }

  state.videos.forEach(video => {
    // Filter Shorts if needed (simple heuristic: title/duration - duration not available in snippet easily without another call)
    // We will render all for now.

    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => openPlayer(video);

    card.innerHTML = `
      <div class="thumbnail-wrapper">
        <img src="${video.thumbnail}" alt="${video.title}" class="thumbnail-img" loading="lazy" />
        <div class="play-icon-overlay">▶</div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${video.title}</h3>
        <div class="card-meta">
          <span>${video.channelTitle}</span>
          <span>${new Date(video.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    `;

    videoContainer.appendChild(card);
  });
}

function renderChannelList() {
  channelList.innerHTML = '';
  state.channels.forEach((channel, index) => {
    const li = document.createElement('li');
    li.className = 'channel-item';
    li.innerHTML = `
      <span>${channel.name || channel.id}</span>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;
    channelList.appendChild(li);
  });

  // Re-attach event listeners for remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = e.target.getAttribute('data-index');
      state.channels.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(state.channels));
      renderChannelList();
    };
  });
}

// --- Player Logic ---
function openPlayer(video) {
  // Use No-Cookie to avoid tracking? No, standard is better for Premium recognition content-wise.
  // Standard embed URL.
  const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;

  document.getElementById('youtube-player').innerHTML = `
    <iframe 
      width="100%" 
      height="100%" 
      src="${embedUrl}" 
      title="YouTube video player" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
    ></iframe>
  `;

  document.getElementById('video-title').textContent = video.title;
  document.getElementById('video-channel').textContent = video.channelTitle;

  playerModal.classList.remove('hidden');
}

function closePlayer() {
  playerModal.classList.add('hidden');
  document.getElementById('youtube-player').innerHTML = ''; // Stop video
}

// --- Event Listeners ---
function setupEventListeners() {
  // Controls
  document.getElementById('refresh-btn').onclick = fetchAllVideos;

  document.getElementById('settings-btn').onclick = () => {
    // Parent Gate
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 5) + 1;
    const sum = a + b;
    document.getElementById('gate-question').textContent = `What is ${a} + ${b}?`;
    document.getElementById('gate-answer').value = '';

    // Store answer temporarily on the element
    gateModal.dataset.answer = sum;
    gateModal.classList.remove('hidden');
  };

  document.getElementById('gate-submit').onclick = () => {
    const input = parseInt(document.getElementById('gate-answer').value);
    const correct = parseInt(gateModal.dataset.answer);

    if (input === correct) {
      gateModal.classList.add('hidden');
      settingsModal.classList.remove('hidden');
      // Populate API key input if exists
      apiKeyInput.value = state.apiKey;
    } else {
      alert('Incorrect! Ask your parents.');
      gateModal.classList.add('hidden');
    }
  };

  // Settings Modal
  document.getElementById('close-settings').onclick = () => {
    settingsModal.classList.add('hidden');
    searchResultsDropdown.classList.add('hidden');
  }

  document.getElementById('save-api-key').onclick = () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      state.apiKey = key;
      localStorage.setItem(STORAGE_KEY_API, key);
      apiStatus.textContent = 'Key saved!';
      // Try to fetch
      fetchAllVideos();
    }
  };

  // Channel Search Input Listener
  channelSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    clearTimeout(searchDebounce);

    if (query.length < 3) {
      searchResultsDropdown.classList.add('hidden');
      return;
    }

    searchDebounce = setTimeout(() => {
      searchChannels(query);
    }, 500); // 500ms debounce
  });

  // Close search dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchResultsDropdown.classList.add('hidden');
    }
  });

  // Player
  document.getElementById('close-player').onclick = closePlayer;

  // Keyboard Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePlayer();
      settingsModal.classList.add('hidden');
      gateModal.classList.add('hidden');
      searchResultsDropdown.classList.add('hidden');
    }
  });
}

// Start
init();
