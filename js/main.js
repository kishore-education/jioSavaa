 document.addEventListener('DOMContentLoaded', () => {
            // Get references to DOM elements
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            const resultsContainer = document.getElementById('results-container');
            const messageBox = document.getElementById('message-box');
            const artistFilterInput = document.getElementById('artist-filter');
            const yearFilterInput = document.getElementById('year-filter');
            const languageFilterInput = document.getElementById('language-filter');
            const suggestionContainer = document.getElementById('suggestion-container');
            
            // Search icon elements
            const topSearchIcon = document.getElementById('top-search-icon');
            const searchSection = document.getElementById('search-section');
            const advancedFilters = document.getElementById('advanced-filters');
            
            // Audio Player Elements
            const audioPlayer = document.getElementById('audio-player');
            const audioElement = document.getElementById('audio-element');
            const playerSongImage = document.getElementById('player-song-image');
            const playerSongTitle = document.getElementById('player-song-title');
            const playerSongArtist = document.getElementById('player-song-artist');
            const playPauseBtn = document.getElementById('play-pause-btn');
            const playIcon = document.getElementById('play-icon');
            const pauseIcon = document.getElementById('pause-icon');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const progressBar = document.getElementById('progress-bar');
            const progressContainer = document.getElementById('progress-container');
            const currentTimeDisplay = document.getElementById('current-time');
            const totalTimeDisplay = document.getElementById('total-time');
            const volumeBtn = document.getElementById('volume-btn');
            const volumeHighIcon = document.getElementById('volume-high-icon');
            const volumeMuteIcon = document.getElementById('volume-mute-icon');
            const volumeSlider = document.getElementById('volume-slider');
            const volumeProgress = document.getElementById('volume-progress');
            const playlistBtn = document.getElementById('playlist-btn');
            const playlistDropdown = document.getElementById('playlist-dropdown');
            const playlistItems = document.getElementById('playlist-items');
            const playlistCount = document.getElementById('playlist-count');

            // API base URLs
            // Primary API URL - This is the documented API endpoint
            const PRIMARY_API_URL = 'https://jiosaavn-api.kishoresaravanan440.workers.dev';
            // Fallback API URLs (in case the primary is down)
            const FALLBACK_API_URL = 'https://saavn.me';
            const THIRD_API_URL = 'https://api.saavn.dev';
            // Current API URL to use
            let API_BASE_URL = PRIMARY_API_URL;
            // Number of songs to request from the API
            const SONGS_LIMIT = 100;

            // References to message box elements
            const loadingSpinner = document.getElementById('loading-spinner');
            const messageText = document.getElementById('message-text');

            // Function to show a message to the user
            const showMessage = (text, type = 'info', isLoading = false) => {
                messageText.textContent = text;
                messageBox.className = `mb-6 p-4 rounded-lg text-center font-medium transition-opacity duration-300 ${type === 'error' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'} block opacity-100`;
                
                // Show or hide the loading spinner
                if (isLoading) {
                    loadingSpinner.classList.remove('hidden');
                } else {
                    loadingSpinner.classList.add('hidden');
                }
            };

            // Function to clear the message box
            const hideMessage = () => {
                messageBox.classList.add('hidden');
                messageBox.classList.remove('block');
                loadingSpinner.classList.add('hidden');
            };

            // Function to fetch and display song results
            const fetchSongs = async (query) => {
                // Clear previous results and show loading message
                resultsContainer.innerHTML = '';
                if (!query) {
                    showMessage('Please enter a song name to search.', 'error');
                    return;
                }
                
                // Get filter values
                const artistFilter = artistFilterInput.value.trim();
                const yearFilter = yearFilterInput.value.trim();
                const languageFilter = languageFilterInput.value;
                
                // Include filters in the search query if they are set
                let enhancedQuery = query;
                if (artistFilter) enhancedQuery += ` ${artistFilter}`;
                if (yearFilter) enhancedQuery += ` ${yearFilter}`;
                if (languageFilter && languageFilter !== "") enhancedQuery += ` ${languageFilter}`;
                
                console.log('Enhanced search query:', enhancedQuery);
                showMessage(`Searching for up to ${SONGS_LIMIT} songs with filters...`, 'info', true);

                try {                    
                    // Construct the search URL with the query using the correct endpoint
                    // Different APIs have different endpoint structures
                    // Set limit to fetch the specified number of songs from all APIs
                    let url;
                    if (API_BASE_URL === PRIMARY_API_URL) {
                        url = `${API_BASE_URL}/api/search/songs?query=${encodeURIComponent(enhancedQuery)}&limit=${SONGS_LIMIT}`;
                    } else if (API_BASE_URL === FALLBACK_API_URL) {
                        url = `${API_BASE_URL}/api/search/songs?query=${encodeURIComponent(enhancedQuery)}&page=1&limit=${SONGS_LIMIT}`;
                    } else {
                        url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(enhancedQuery)}&limit=${SONGS_LIMIT}`;
                    }
                    
                    console.log('Fetching from URL:', url);
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });

                    // Check if the response is successful
                    if (!response.ok) {
                        console.error('API Error Status:', response.status);
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    // Handle different API response structures
                    let songs = [];
                    if (API_BASE_URL === PRIMARY_API_URL) {
                        // Primary API structure (jiosaavn-api.kishoresaravanan440.workers.dev)
                        if (data.data && Array.isArray(data.data)) {
                            songs = data.data;
                        } else if (data.data && data.data.results && Array.isArray(data.data.results)) {
                            songs = data.data.results;
                        } else if (data.results && Array.isArray(data.results)) {
                            songs = data.results;
                        } else {
                            songs = data.data || [];
                        }
                        console.log('Found songs from primary API:', songs.length, songs);
                    } else if (API_BASE_URL === FALLBACK_API_URL) {
                        // Fallback API structure (saavn.me)
                        songs = data.data?.results || data.results || [];
                        console.log('Found songs from fallback API:', songs.length, songs);
                    } else {
                        // Third API structure
                        songs = data.data || data.results || [];
                        console.log('Found songs from third API:', songs.length, songs);
                    }
                    
                    // Log raw response for debugging
                    console.log('Raw API response:', data);
                    
                    // Apply additional client-side filtering for more precise results
                    // Note: We're already including these in the API query, but we'll filter again
                    // for more precise matching (e.g., exact year match)

                    // Ensure songs is always an array
                    if (!Array.isArray(songs)) {
                        console.error('Songs is not an array:', songs);
                        songs = [];
                    }

                    const filteredSongs = songs.filter(song => {
                        if (!song) return false; // Skip null or undefined items
                        
                        // Handle different API response structures for artist name
                        let artistName = '';
                        if (song.primaryArtists) {
                            artistName = song.primaryArtists;
                        } else if (song.artists && song.artists.primary) {
                            artistName = song.artists.primary.map(a => a.name).join(', ');
                        } else if (song.artist) {
                            artistName = typeof song.artist === 'string' ? song.artist : JSON.stringify(song.artist);
                        }
                        
                        const songYear = song.year || '';
                        const songLanguage = song.language || '';

                        const artistMatch = !artistFilter || (artistName && artistName.toLowerCase().includes(artistFilter.toLowerCase()));
                        const yearMatch = !yearFilter || (songYear && songYear.toString() === yearFilter);
                        const languageMatch = !languageFilter || (languageFilter === "" || (songLanguage && songLanguage.toLowerCase() === languageFilter.toLowerCase()));

                        return artistMatch && yearMatch && languageMatch;
                    });

                    // Check if there are songs in the data
                    if (filteredSongs.length > 0) {
                        hideMessage();
                        console.log('Displaying', filteredSongs.length, 'out of', songs.length, 'songs after filtering');
                        showMessage(`Found ${songs.length} songs, showing ${filteredSongs.length} after filtering.`, 'info');
                        setTimeout(hideMessage, 3000); // Hide message after 3 seconds
                        // Loop through the songs and create a card for each (show all related songs)
                        filteredSongs.forEach((song, idx) => {
                            // Extract song details based on API structure
                            let songName, artistName, albumName, image, downloadUrl;
                            
                            if (API_BASE_URL === PRIMARY_API_URL) {
                                songName = song.name || 'Unknown';
                                if (song.artists && song.artists.primary) {
                                    artistName = song.artists.primary.map(artist => artist.name).join(', ');
                                } else {
                                    artistName = song.primaryArtists || 'Unknown Artist';
                                }
                                albumName = song.album?.name || 'Unknown Album';
                                if (song.image && song.image.length > 0) {
                                    const img500 = song.image.find(img => img.quality === '500x500');
                                    image = img500?.url || song.image[song.image.length - 1].url;
                                } else {
                                    image = 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                                }
                                if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
                                    // Look for the highest quality download URL available
                                    // First try 320kbps, then 160kbps, then the highest available
                                    const qualityPriority = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
                                    let selectedDownload = null;
                                    
                                    // Try to find the best quality available according to our priority list
                                    for (const quality of qualityPriority) {
                                        const found = song.downloadUrl.find(dl => dl && dl.quality === quality);
                                        if (found && found.url) {
                                            selectedDownload = found;
                                            break;
                                        }
                                    }
                                    
                                    // If no match found by quality name, sort by quality if it's a number value
                                    if (!selectedDownload) {
                                        const sortedByQuality = [...song.downloadUrl]
                                            .filter(dl => dl && dl.url)
                                            .sort((a, b) => {
                                                const qualityA = parseInt(a.quality);
                                                const qualityB = parseInt(b.quality);
                                                return isNaN(qualityA) || isNaN(qualityB) ? 0 : qualityB - qualityA;
                                            });
                                        
                                        if (sortedByQuality.length > 0) {
                                            selectedDownload = sortedByQuality[0];
                                        }
                                    }
                                    
                                    // If still no match, use the last one as a fallback
                                    if (selectedDownload && selectedDownload.url) {
                                        downloadUrl = selectedDownload.url;
                                        console.log(`Selected download quality: ${selectedDownload.quality}`);
                                    } else if (song.downloadUrl[song.downloadUrl.length - 1] && song.downloadUrl[song.downloadUrl.length - 1].url) {
                                        downloadUrl = song.downloadUrl[song.downloadUrl.length - 1].url;
                                        console.log(`Fallback to last download option`);
                                    } else {
                                        downloadUrl = null;
                                    }
                                } else {
                                    downloadUrl = null;
                                }
                            } else if (API_BASE_URL === FALLBACK_API_URL) {
                                songName = song.name || song.title || 'Unknown';
                                artistName = song.primaryArtists || 'Unknown Artist';
                                albumName = song.album?.name || 'Unknown Album';
                                image = song.image?.[2]?.link || song.image || 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                                
                                // Get highest quality download URL - for FALLBACK API
                                if (song.downloadUrl && Array.isArray(song.downloadUrl)) {
                                    // Try high quality options first (4 is usually 320kbps)
                                    downloadUrl = song.downloadUrl[4]?.link || song.downloadUrl[3]?.link || 
                                                song.downloadUrl[2]?.link || song.downloadUrl[1]?.link || 
                                                song.downloadUrl[0]?.link || song.url;
                                    console.log('Selected fallback API download quality:', 
                                        song.downloadUrl.findIndex(dl => dl?.link === downloadUrl) !== -1 ? 
                                        `Option ${song.downloadUrl.findIndex(dl => dl?.link === downloadUrl) + 1} of ${song.downloadUrl.length}` : 'URL fallback');
                                } else {
                                    downloadUrl = song.url;
                                }
                            } else {
                                songName = song.name || song.title || 'Unknown';
                                artistName = song.artists?.primary?.map(artist => artist.name).join(', ') || song.primaryArtists || 'Unknown Artist';
                                albumName = song.album?.name || 'Unknown Album';
                                image = song.image?.[2]?.url || song.image || 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                                
                                // Get highest quality download URL - for THIRD API
                                if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
                                    // Sort download URLs if they have a quality property that can be parsed as a number
                                    const sortedDownloads = [...song.downloadUrl]
                                        .filter(dl => dl && dl.url)
                                        .sort((a, b) => {
                                            // Try to extract bitrate numbers if available
                                            const qualityA = a.quality ? parseInt(a.quality.replace(/[^0-9]/g, '')) : 0;
                                            const qualityB = b.quality ? parseInt(b.quality.replace(/[^0-9]/g, '')) : 0;
                                            // Higher number means better quality
                                            return qualityB - qualityA;
                                        });
                                    
                                    if (sortedDownloads.length > 0) {
                                        downloadUrl = sortedDownloads[0].url;
                                        console.log('Selected third API download quality:', sortedDownloads[0].quality || 'Highest available');
                                    } else {
                                        downloadUrl = song.url;
                                    }
                                } else {
                                    downloadUrl = song.url;
                                }
                            }
                            const fallbackImage = 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                            const duration = song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--';
                            const language = song.language ? song.language.charAt(0).toUpperCase() + song.language.slice(1) : '';
                            const year = song.year || '';
                            // Get quality info for the selected download URL
                            let quality = '';
                            if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > 0) {
                                const selectedDownload = song.downloadUrl.find(dl => dl && dl.url === downloadUrl);
                                if (selectedDownload && selectedDownload.quality) {
                                    quality = selectedDownload.quality;
                                } else {
                                    // If we can't find the exact download URL match, use the highest quality label
                                    const sortedByQuality = [...song.downloadUrl]
                                        .filter(dl => dl && dl.quality)
                                        .sort((a, b) => {
                                            const qualityA = parseInt(a.quality);
                                            const qualityB = parseInt(b.quality);
                                            return isNaN(qualityA) || isNaN(qualityB) ? 0 : qualityB - qualityA;
                                        });
                                    quality = sortedByQuality.length > 0 ? sortedByQuality[0].quality : '320kbps';
                                }
                            }
                            const songCard = document.createElement('div');
                            songCard.className = 'bg-gray-700 rounded-xl shadow-lg overflow-hidden flex flex-col transition-transform duration-200 hover:scale-105';
                            songCard.innerHTML = `
                                <div class="relative group">
                                    <img src="${image}" alt="${songName}" class="w-full h-48 object-cover" onerror="this.src='${fallbackImage}'">
                                    <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button class="play-song-btn p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-transform duration-200 hover:scale-110">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="p-4 flex flex-col flex-grow">
                                    <h3 class="text-xl font-bold mb-1 truncate">${songName}</h3>
                                    <p class="text-sm text-gray-300 truncate">Artist: ${artistName}</p>
                                    <p class="text-sm text-gray-400 truncate">Album: ${albumName}</p>
                                    <div class="flex flex-wrap text-xs text-gray-400 gap-2 mt-1 mb-4">
                                        ${duration ? `<span class="bg-gray-600 px-2 py-1 rounded-md">${duration}</span>` : ''}
                                        ${language ? `<span class="bg-gray-600 px-2 py-1 rounded-md">${language}</span>` : ''}
                                        ${year ? `<span class="bg-gray-600 px-2 py-1 rounded-md">${year}</span>` : ''}
                                        ${quality ? `<span class="bg-gray-600 px-2 py-1 rounded-md">${quality}</span>` : ''}
                                    </div>
                                    <div class="flex gap-2 mt-auto">
                                        <button class="view-details-btn flex-1 px-4 py-2 bg-blue-600 text-white font-bold text-center rounded-full hover:bg-blue-700 transition-colors duration-200">
                                            Info
                                        </button>
                                        <button class="add-to-playlist-btn flex-1 px-4 py-2 bg-purple-600 text-white font-bold text-center rounded-full hover:bg-purple-700 transition-colors duration-200">
                                            Add to Playlist
                                        </button>
                                    </div>
                                </div>
                            `;
                            // Create song data object
                            const songData = {
                                name: songName,
                                artist: artistName,
                                album: albumName,
                                image: image,
                                downloadUrl: downloadUrl,
                                quality: quality,
                                year: year,
                                language: language,
                                duration: song.duration || 0
                            };
                            
                            // Add event listener to view details button
                            const viewDetailsBtn = songCard.querySelector('.view-details-btn');
                            viewDetailsBtn.addEventListener('click', () => {
                                showSongDetails(songData);
                            });
                            
                            // Add event listener to play button
                            const playBtn = songCard.querySelector('.play-song-btn');
                            if (downloadUrl) {
                                playBtn.addEventListener('click', () => {
                                    addToPlaylist(songData);
                                    playSong(songData);
                                });
                            } else {
                                playBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                playBtn.disabled = true;
                            }
                            
                            // Add event listener to Add to Playlist button
                            const addToPlaylistBtn = songCard.querySelector('.add-to-playlist-btn');
                            if (downloadUrl) {
                                addToPlaylistBtn.addEventListener('click', () => {
                                    addToPlaylist(songData);
                                    showMessage('Added to your playlist!', 'success');
                                });
                            } else {
                                addToPlaylistBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                                addToPlaylistBtn.classList.add('bg-gray-500', 'cursor-not-allowed');
                                addToPlaylistBtn.disabled = true;
                                addToPlaylistBtn.textContent = 'Unavailable';
                            }
                            
                            resultsContainer.appendChild(songCard);
                        });
                    } else {
                        showMessage('No songs found for your search query and filters. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Failed to fetch songs:', error);
                    
                    // If using the primary API and it failed, try the fallback API
                    if (API_BASE_URL === PRIMARY_API_URL) {
                        API_BASE_URL = FALLBACK_API_URL;
                        showMessage('Primary API failed. Trying fallback API...', 'info');
                        console.log('Switching to fallback API:', FALLBACK_API_URL);
                        // Try again with the fallback API
                        setTimeout(() => fetchSongs(query), 1000);
                        return;
                    }
                    // If using the fallback API and it failed, try the third API
                    else if (API_BASE_URL === FALLBACK_API_URL) {
                        API_BASE_URL = THIRD_API_URL;
                        showMessage('Fallback API failed. Trying another API source...', 'info');
                        console.log('Switching to third API:', THIRD_API_URL);
                        // Try again with the third API
                        setTimeout(() => fetchSongs(query), 1000);
                        return;
                    }
                    
                    // Reset to primary API for next search attempt
                    API_BASE_URL = PRIMARY_API_URL;
                    
                    // If we've tried all APIs and all failed
                    showMessage(`Error: All API endpoints failed. Please check your connection or try a different search term. Error: ${error.message}`, 'error');
                    console.error('Full error details:', error);
                }
            };

            // Gemini API configuration
            const GEMINI_API_KEY = 'AIzaSyBl_dLKjBX4qvyLe6rLNaO2KDjQDL4IOJY';
            const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
            const GEMINI_DETAIL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
            
            // Rate limiting variables for Gemini API
            let lastGeminiRequestTime = 0;
            const MIN_REQUEST_INTERVAL = 1500; // Minimum 1.5 seconds between API calls
            
            // Exponential backoff parameters
            const MAX_RETRIES = 3;
            const BASE_DELAY = 2000; // Start with 2 second delay
            let typingTimer;
            const TYPING_DELAY = 650; // increased to reduce API calls during typing
            
            // Suggestion cache to speed up repeat searches
            const suggestionCache = new Map();
            const songDetailsCache = new Map();
            const CACHE_EXPIRY = 60 * 60 * 1000; // Cache entries expire after 1 hour
            
            // Function to get search suggestions from Gemini API
            const getSuggestions = async (query) => {
                if (!query || query.length < 2) {
                    suggestionContainer.style.display = 'none';
                    return;
                }
                
                // Check cache first
                const cacheKey = query.toLowerCase();
                if (suggestionCache.has(cacheKey)) {
                    const { suggestions, timestamp } = suggestionCache.get(cacheKey);
                    // Use cache if it's not expired
                    if (Date.now() - timestamp < CACHE_EXPIRY) {
                        console.log('Using cached suggestions for:', query);
                        displaySuggestions(suggestions, query);
                        return;
                    } else {
                        // Remove expired cache entry
                        suggestionCache.delete(cacheKey);
                    }
                }
                
                // Show loading indicator for new searches
                suggestionContainer.innerHTML = '<div class="p-2 text-center text-gray-400">Loading suggestions...</div>';
                suggestionContainer.style.display = 'block';
                
                try {
                    const prompt = `
                    User is searching for music with query: "${query}"
                    
                    Generate 5 search suggestions for music (songs, albums, or artists) that the user might be looking for.
                    The suggestions should be related to popular music that matches the query.
                    
                    Format your response as a JSON array of strings only, with no explanations.
                    Example: ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4", "Suggestion 5"]
                    `;
                    
                    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: prompt
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.1,  // Lower temperature for more predictable results
                                maxOutputTokens: 100,  // Reduced for faster response
                                topK: 10,  // Limit token selection for faster generation
                                topP: 0.8  // Narrow probability distribution
                            },
                            safetySettings: [
                                {
                                    category: "HARM_CATEGORY_HARASSMENT",
                                    threshold: "BLOCK_NONE"
                                }
                            ]
                        })
                    });
                    
                    if (!response.ok) {
                        console.error('Gemini API error:', response.status);
                        return;
                    }
                    
                    const data = await response.json();
                    
                    // Extract the suggestions from the response
                    const textResponse = data.candidates[0].content.parts[0].text;
                    
                    // Parse JSON from text response
                    let suggestions;
                    try {
                        suggestions = JSON.parse(textResponse);
                    } catch (e) {
                        // If parsing fails, try to extract array manually
                        const match = textResponse.match(/\[(.*?)\]/s);
                        if (match) {
                            try {
                                suggestions = JSON.parse(`[${match[1]}]`);
                            } catch (e2) {
                                console.error('Could not parse suggestions:', e2);
                                suggestions = [];
                            }
                        } else {
                            suggestions = [];
                        }
                    }
                    
                    if (Array.isArray(suggestions) && suggestions.length > 0) {
                        // Save to cache
                        suggestionCache.set(query.toLowerCase(), {
                            suggestions,
                            timestamp: Date.now()
                        });
                        
                        // Limit cache size to avoid memory issues
                        if (suggestionCache.size > 100) {
                            // Delete oldest entry
                            const oldestKey = suggestionCache.keys().next().value;
                            suggestionCache.delete(oldestKey);
                        }
                        
                        displaySuggestions(suggestions, query);
                    } else {
                        suggestionContainer.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    suggestionContainer.style.display = 'none';
                    
                    // Show default suggestions on error
                    const defaultSuggestions = [
                        `${query} songs`, 
                        `${query} album`,
                        `${query} artist`, 
                        `Best of ${query}`,
                        `Popular ${query} tracks`
                    ];
                    displaySuggestions(defaultSuggestions, query);
                }
            };
            
            // Function to display suggestions
            const displaySuggestions = (suggestions, query) => {
                suggestionContainer.innerHTML = '';
                
                suggestions.forEach(suggestion => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    
                    // Highlight the matching part
                    const lowercaseQuery = query.toLowerCase();
                    const lowercaseSuggestion = suggestion.toLowerCase();
                    const index = lowercaseSuggestion.indexOf(lowercaseQuery);
                    
                    if (index !== -1) {
                        const before = suggestion.substring(0, index);
                        const match = suggestion.substring(index, index + query.length);
                        const after = suggestion.substring(index + query.length);
                        item.innerHTML = `${before}<span class="suggestion-highlight">${match}</span>${after}`;
                    } else {
                        item.textContent = suggestion;
                    }
                    
                    // Add enhanced click handler with visual feedback
                    item.addEventListener('click', (e) => {
                        // Add visual feedback
                        item.classList.add('selected');
                        
                        // Set input value to suggestion
                        searchInput.value = suggestion;
                        
                        // Hide the suggestion container
                        suggestionContainer.style.display = 'none';
                        
                        // Trigger search with a small delay for better UX
                        setTimeout(() => {
                            fetchSongs(suggestion);
                        }, 100);
                        
                        // Focus the input after selection
                        searchInput.focus();
                    });
                    
                    // Also trigger on mouse down for faster response
                    item.addEventListener('mousedown', (e) => {
                        // Prevent default to avoid losing focus on the input
                        e.preventDefault();
                    });
                    
                    // Add touch support for mobile devices
                    item.addEventListener('touchstart', (e) => {
                        // Add visual active state for touch
                        item.classList.add('selected');
                    });
                    
                    suggestionContainer.appendChild(item);
                });
                
                suggestionContainer.style.display = 'block';
            };
            
            // Handle input changes for suggestions
            let lastQuery = '';
            searchInput.addEventListener('input', (e) => {
                clearTimeout(typingTimer);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    suggestionContainer.style.display = 'none';
                    return;
                }
                
                // Prevent duplicate API calls for the same query
                if (query === lastQuery) {
                    return;
                }
                
                // Check for prefix match in cache for instant suggestions
                const prefixMatch = Array.from(suggestionCache.keys()).find(key => 
                    query.toLowerCase().startsWith(key) && key.length > 2);
                
                if (prefixMatch) {
                    const { suggestions } = suggestionCache.get(prefixMatch);
                    // Filter cached suggestions to match current query
                    const filteredSuggestions = suggestions.filter(suggestion => 
                        suggestion.toLowerCase().includes(query.toLowerCase()));
                    
                    if (filteredSuggestions.length > 0) {
                        console.log('Using prefix-matched suggestions');
                        displaySuggestions(filteredSuggestions, query);
                        
                        // Still fetch new suggestions but with lower priority
                        setTimeout(() => {
                            if (searchInput.value.trim() === query) {
                                getSuggestions(query);
                            }
                        }, 1000);
                        
                        return;
                    }
                }
                
                lastQuery = query;
                
                // Wait until typing stops before making API call
                typingTimer = setTimeout(() => {
                    getSuggestions(query);
                }, TYPING_DELAY);
            });
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target !== searchInput && !suggestionContainer.contains(e.target)) {
                    suggestionContainer.style.display = 'none';
                }
            });
            
            // Handle keyboard navigation for suggestions
            searchInput.addEventListener('keydown', (e) => {
                const items = suggestionContainer.querySelectorAll('.suggestion-item');
                if (!items.length) return;
                
                const activeItem = suggestionContainer.querySelector('.suggestion-item.selected');
                let index = Array.from(items).indexOf(activeItem);
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (suggestionContainer.style.display === 'none') {
                        suggestionContainer.style.display = 'block';
                        return;
                    }
                    
                    if (index < 0) {
                        index = 0;
                    } else {
                        items[index].classList.remove('selected');
                        index = (index + 1) % items.length;
                    }
                    items[index].classList.add('selected');
                    items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (suggestionContainer.style.display === 'none') return;
                    
                    if (index < 0) {
                        index = items.length - 1;
                    } else {
                        items[index].classList.remove('selected');
                        index = (index - 1 + items.length) % items.length;
                    }
                    items[index].classList.add('selected');
                    items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                } else if (e.key === 'Enter' && activeItem) {
                    e.preventDefault();
                    searchInput.value = activeItem.textContent.trim();
                    suggestionContainer.style.display = 'none';
                    fetchSongs(searchInput.value);
                } else if (e.key === 'Escape') {
                    suggestionContainer.style.display = 'none';
                }
            });
            
            // Event listeners for search
            searchButton.addEventListener('click', () => {
                const query = searchInput.value.trim();
                fetchSongs(query);
            });

            searchInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && !event.isComposing) {
                    const query = searchInput.value.trim();
                    suggestionContainer.style.display = 'none';
                    fetchSongs(query);
                }
            });
            
            // Modal elements
            const songDetailModal = document.getElementById('song-detail-modal');
            const modalClose = document.getElementById('modal-close');
            const modalSongTitle = document.getElementById('modal-song-title');
            const modalSongArtist = document.getElementById('modal-song-artist');
            const modalSongAlbum = document.getElementById('modal-song-album');
            const modalSongImage = document.getElementById('modal-song-image');
            const modalDownloadButton = document.getElementById('modal-download-button');
            const songDetailLoading = document.getElementById('song-detail-loading');
            const songDetailInfo = document.getElementById('song-detail-info');
            
            // Close modal when clicking the close button or outside the modal
            modalClose.addEventListener('click', () => {
                songDetailModal.classList.remove('active');
            });
            
            songDetailModal.addEventListener('click', (e) => {
                if (e.target === songDetailModal) {
                    songDetailModal.classList.remove('active');
                }
            });
            
            // Function to get song details from Gemini
            const getSongDetails = async (songInfo) => {
                const cacheKey = `${songInfo.name}-${songInfo.artist}`;
                
                // Check cache first
                if (songDetailsCache.has(cacheKey)) {
                    const { details, timestamp } = songDetailsCache.get(cacheKey);
                    if (Date.now() - timestamp < CACHE_EXPIRY) {
                        console.log('Using cached song details');
                        return details;
                    } else {
                        songDetailsCache.delete(cacheKey);
                    }
                }
                
                try {
                    const prompt = `
                    I need detailed information about this song:
                    Song Name: "${songInfo.name}"
                    Artist: "${songInfo.artist}"
                    Album: "${songInfo.album || 'Unknown'}"
                    
                    Please provide the following information in JSON format:
                    1. A brief background about the song (when it was released, significance, etc.)
                    2. Information about the artist
                    3. Genre and musical style
                    4. Notable lyrics or themes (if it's a significant song)
                    5. Reception and popularity
                    6. Related songs that fans might enjoy
                    
                    Format your response as a valid JSON object with these keys:
                    {
                      "background": "...",
                      "artistInfo": "...",
                      "genre": "...",
                      "themes": "...",
                      "reception": "...",
                      "relatedSongs": ["Song 1", "Song 2", "Song 3"],
                      "tags": ["tag1", "tag2", "tag3"]
                    }
                    
                    Respond ONLY with the JSON. No other text.
                    `;
                    
                    const response = await fetch(`${GEMINI_DETAIL_URL}?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: prompt
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.2,
                                maxOutputTokens: 1024
                            }
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Gemini API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    const textResponse = data.candidates[0].content.parts[0].text;
                    
                    // Parse the JSON response
                    let details;
                    try {
                        // Try to extract JSON from the response
                        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            details = JSON.parse(jsonMatch[0]);
                        } else {
                            throw new Error('No JSON found in response');
                        }
                    } catch (e) {
                        console.error('Failed to parse song details JSON:', e);
                        details = {
                            background: "Information not available at this moment.",
                            artistInfo: "Details about the artist could not be retrieved.",
                            genre: "Unknown",
                            themes: "Not available",
                            reception: "Information not available",
                            relatedSongs: [],
                            tags: ["music"]
                        };
                    }
                    
                    // Save to cache
                    songDetailsCache.set(cacheKey, {
                        details,
                        timestamp: Date.now()
                    });
                    
                    return details;
                } catch (error) {
                    console.error('Error fetching song details:', error);
                    return {
                        background: "Information not available at this moment.",
                        artistInfo: "Details about the artist could not be retrieved.",
                        genre: "Unknown",
                        themes: "Not available",
                        reception: "Information not available",
                        relatedSongs: [],
                        tags: ["music"]
                    };
                }
            };
            
            // Function to show song details in modal
            const showSongDetails = async (song) => {
                // Display song basic info
                modalSongTitle.textContent = song.name;
                modalSongArtist.textContent = song.artist;
                modalSongAlbum.textContent = song.album || '';
                modalSongImage.src = song.image;
                modalSongImage.onerror = () => {
                    modalSongImage.src = 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                };
                
                // Set download button
                if (song.downloadUrl) {
                    modalDownloadButton.href = song.downloadUrl;
                    modalDownloadButton.download = `${song.name}.mp3`;
                    modalDownloadButton.classList.remove('bg-gray-500', 'cursor-not-allowed');
                    modalDownloadButton.classList.add('bg-purple-600', 'hover:bg-purple-700');
                    modalDownloadButton.textContent = `Download ${song.quality ? `(${song.quality})` : ''}`;
                } else {
                    modalDownloadButton.removeAttribute('href');
                    modalDownloadButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                    modalDownloadButton.classList.add('bg-gray-500', 'cursor-not-allowed');
                    modalDownloadButton.textContent = 'Download Unavailable';
                }
                
                // Show loading state
                songDetailLoading.classList.remove('hidden');
                songDetailInfo.classList.add('hidden');
                songDetailInfo.innerHTML = '';
                
                // Show modal
                songDetailModal.classList.add('active');
                
                // Fetch song details from Gemini
                const details = await getSongDetails(song);
                
                // Hide loading state
                songDetailLoading.classList.add('hidden');
                songDetailInfo.classList.remove('hidden');
                
                // Populate details
                const detailHTML = `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">About this Song</h3>
                        <p class="text-gray-300">${details.background}</p>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">Artist</h3>
                        <p class="text-gray-300">${details.artistInfo}</p>
                    </div>
                    
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">Genre & Style</h3>
                        <p class="text-gray-300">${details.genre}</p>
                    </div>
                    
                    ${details.themes ? `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">Themes & Lyrics</h3>
                        <p class="text-gray-300">${details.themes}</p>
                    </div>
                    ` : ''}
                    
                    ${details.reception ? `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">Reception</h3>
                        <p class="text-gray-300">${details.reception}</p>
                    </div>
                    ` : ''}
                    
                    ${details.relatedSongs && details.relatedSongs.length > 0 ? `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold text-purple-400 mb-2">You Might Also Like</h3>
                        <ul class="list-disc list-inside text-gray-300 ml-2">
                            ${details.relatedSongs.map(song => `<li>${song}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${details.tags && details.tags.length > 0 ? `
                    <div class="mt-4">
                        <div class="flex flex-wrap gap-1">
                            ${details.tags.map(tag => `<span class="song-detail-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                `;
                
                songDetailInfo.innerHTML = detailHTML;
            };
            
            // Audio Player Functionality
            
            // Local Storage Keys
            const STORAGE_KEYS = {
                PLAYLISTS: 'music_player_playlists',
                CURRENT_PLAYLIST: 'music_player_current_playlist',
                CURRENT_INDEX: 'music_player_current_index',
                VOLUME: 'music_player_volume',
                LAST_PLAYED: 'music_player_last_played'
            };
            
            // Playlist Management
            let playlists = {
                'default': { name: 'My Playlist', songs: [] }
            };
            let currentPlaylistId = 'default';
            let currentSongIndex = -1;
            
            // Shorthand for accessing current playlist
            const getCurrentPlaylist = () => playlists[currentPlaylistId].songs;
            
            // Load saved playlists from local storage
            const loadSavedPlaylist = () => {
                try {
                    const savedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
                    const savedCurrentPlaylist = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAYLIST);
                    const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
                    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
                    
                    if (savedPlaylists) {
                        playlists = JSON.parse(savedPlaylists);
                        console.log('Loaded saved playlists');
                        
                        // Make sure default playlist exists
                        if (!playlists['default']) {
                            playlists['default'] = { name: 'My Playlist', songs: [] };
                        }
                        
                        // Populate playlist selector
                        updatePlaylistSelector();
                    }
                    
                    if (savedCurrentPlaylist && playlists[savedCurrentPlaylist]) {
                        currentPlaylistId = savedCurrentPlaylist;
                        if (playlistSelect) {
                            playlistSelect.value = currentPlaylistId;
                        }
                    }
                    
                    if (savedIndex !== null) {
                        currentSongIndex = parseInt(savedIndex);
                    }
                    
                    if (savedVolume !== null) {
                        const volume = parseFloat(savedVolume);
                        audioElement.volume = volume;
                        volumeProgress.style.width = `${volume * 100}%`;
                        
                        if (volume === 0) {
                            volumeHighIcon.classList.add('hidden');
                            volumeMuteIcon.classList.remove('hidden');
                        }
                    }
                    
                    // Update UI with loaded playlist
                    updatePlaylistDisplay();
                    
                    // If we have a current song, show the player but don't autoplay
                    const currentPlaylist = getCurrentPlaylist();
                    if (currentSongIndex >= 0 && currentSongIndex < currentPlaylist.length) {
                        const currentSong = currentPlaylist[currentSongIndex];
                        
                        // Update player UI without playing
                        playerSongImage.src = currentSong.image || 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                        playerSongTitle.textContent = currentSong.name;
                        playerSongArtist.textContent = currentSong.artist;
                        audioPlayer.classList.add('active');
                        
                        // Prepare the audio source without playing
                        audioElement.src = currentSong.downloadUrl;
                        audioElement.load();
                    }
                    
                } catch (error) {
                    console.error('Error loading saved playlist:', error);
                    // If there's an error, reset the playlist
                    playlist = [];
                    currentSongIndex = -1;
                }
            };
            
            // Save playlist to local storage
            const savePlaylistToStorage = () => {
                try {
                    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
                    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYLIST, currentPlaylistId);
                    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentSongIndex.toString());
                    localStorage.setItem(STORAGE_KEYS.VOLUME, audioElement.volume.toString());
                    localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, Date.now().toString());
                    console.log('Saved playlists to local storage');
                } catch (error) {
                    console.error('Error saving playlists:', error);
                }
            };
            
            // Function to add a song to the current playlist
            const addToPlaylist = (song) => {
                const currentPlaylist = getCurrentPlaylist();
                
                // Check if song is already in playlist
                const songExists = currentPlaylist.findIndex(item => 
                    item.name === song.name && item.artist === song.artist);
                
                if (songExists !== -1) {
                    // If it exists, we'll just play it
                    currentSongIndex = songExists;
                } else {
                    // Add to playlist
                    currentPlaylist.push(song);
                    currentSongIndex = currentPlaylist.length - 1;
                    
                    // Update playlist display
                    updatePlaylistDisplay();
                    
                    // Save to local storage
                    savePlaylistToStorage();
                }
            };
            
            // Function to update playlist display
            const updatePlaylistDisplay = () => {
                const currentPlaylist = getCurrentPlaylist();
                playlistCount.textContent = currentPlaylist.length;
                playlistItems.innerHTML = '';
                
                if (currentPlaylist.length === 0) {
                    playlistItems.innerHTML = '<div class="p-4 text-center text-gray-400">No songs in playlist</div>';
                    return;
                }
                
                getCurrentPlaylist().forEach((song, index) => {
                    const isActive = index === currentSongIndex;
                    
                    const formatDuration = (seconds) => {
                        if (!seconds) return '--:--';
                        const minutes = Math.floor(seconds / 60);
                        const remainingSeconds = Math.floor(seconds % 60);
                        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                    };
                    
                    const item = document.createElement('div');
                    item.className = `playlist-item ${isActive ? 'active' : ''}`;
                    item.innerHTML = `
                        <img class="playlist-item-img" src="${song.image || 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image'}" onerror="this.src='https://placehold.co/500x500/1e293b/d1d5db?text=No+Image'">
                        <div class="playlist-item-info">
                            <div class="playlist-item-title">${song.name}</div>
                            <div class="playlist-item-artist">${song.artist}</div>
                        </div>
                        <div class="playlist-item-duration">${formatDuration(song.duration)}</div>
                        <div class="playlist-item-remove" data-index="${index}">×</div>
                    `;
                    
                    // Add event listener to play this song when clicked
                    item.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('playlist-item-remove')) {
                            currentSongIndex = index;
                            playSong(song);
                        }
                    });
                    
                    playlistItems.appendChild(item);
                });
                
                // Add event listeners for remove buttons
                document.querySelectorAll('.playlist-item-remove').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(e.target.dataset.index);
                        removeFromPlaylist(index);
                    });
                });
            };
            
            // Function to remove a song from the playlist
            const removeFromPlaylist = (index) => {
                const currentPlaylist = getCurrentPlaylist();
                if (index < 0 || index >= currentPlaylist.length) return;
                
                // Remove the song
                currentPlaylist.splice(index, 1);
                
                // Update current index if needed
                if (currentPlaylist.length === 0) {
                    currentSongIndex = -1;
                    pauseSong();
                } else if (index === currentSongIndex) {
                    // If we removed the current song, play next song
                    currentSongIndex = index % currentPlaylist.length;
                    playSong(currentPlaylist[currentSongIndex]);
                } else if (index < currentSongIndex) {
                    // If we removed a song before the current song, adjust the index
                    currentSongIndex--;
                }
                
                // Update playlist display
                updatePlaylistDisplay();
                
                // Save changes to local storage
                savePlaylistToStorage();
            };
            
            // Function to play a song
            const playSong = (song) => {
                if (!song || !song.downloadUrl) return;
                
                // Update audio source
                audioElement.src = song.downloadUrl;
                audioElement.load();
                
                // Play the song
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            // Update UI to show playing state
                            playIcon.classList.add('hidden');
                            pauseIcon.classList.remove('hidden');
                            
                            // Save current state to local storage
                            savePlaylistToStorage();
                        })
                        .catch(error => {
                            console.error('Error playing song:', error);
                            // Handle autoplay restriction
                            playIcon.classList.remove('hidden');
                            pauseIcon.classList.add('hidden');
                        });
                }
                
                // Update player UI
                playerSongImage.src = song.image || 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Image';
                playerSongTitle.textContent = song.name;
                playerSongArtist.textContent = song.artist;
                
                // Show the player as active
                audioPlayer.classList.add('active');
                audioPlayer.classList.remove('inactive');
                
                // Update playlist highlighting
                updatePlaylistDisplay();
                
                // Save to local storage even if autoplay fails
                savePlaylistToStorage();
            };
            
            // Function to pause the current song
            const pauseSong = () => {
                audioElement.pause();
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            };
            
            // Function to play the next song
            const playNextSong = () => {
                const currentPlaylist = getCurrentPlaylist();
                if (currentPlaylist.length === 0) return;
                
                currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
                playSong(currentPlaylist[currentSongIndex]);
            };
            
            // Function to play the previous song
            const playPreviousSong = () => {
                const currentPlaylist = getCurrentPlaylist();
                if (currentPlaylist.length === 0) return;
                
                currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
                playSong(currentPlaylist[currentSongIndex]);
            };
            
            // Format time display (seconds -> MM:SS)
            const formatTime = (seconds) => {
                if (isNaN(seconds)) return '0:00';
                
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            };
            
            // Update progress bar and time displays
            const updateProgress = () => {
                const { currentTime, duration } = audioElement;
                
                // Update progress bar width
                if (duration) {
                    const progressPercent = (currentTime / duration) * 100;
                    progressBar.style.width = `${progressPercent}%`;
                    
                    // Update time displays
                    currentTimeDisplay.textContent = formatTime(currentTime);
                    totalTimeDisplay.textContent = formatTime(duration);
                } else {
                    progressBar.style.width = '0%';
                    currentTimeDisplay.textContent = '0:00';
                    totalTimeDisplay.textContent = '0:00';
                }
            };
            
            // Set progress when clicking on the progress bar
            const setProgress = (e) => {
                const width = progressContainer.clientWidth;
                const clickPosition = e.offsetX;
                const clickPercent = clickPosition / width;
                audioElement.currentTime = clickPercent * audioElement.duration;
            };
            
            // Handle volume change
            const handleVolumeChange = (e) => {
                const rect = volumeSlider.getBoundingClientRect();
                const width = volumeSlider.clientWidth;
                let clickPosition;
                
                if (e.type === 'touchmove' || e.type === 'touchstart') {
                    // For touch events
                    clickPosition = e.touches[0].clientX - rect.left;
                } else {
                    // For mouse events
                    clickPosition = e.offsetX;
                }
                
                // Ensure value is between 0 and 1
                let volume = Math.max(0, Math.min(1, clickPosition / width));
                
                // Update audio volume
                audioElement.volume = volume;
                
                // Update volume progress bar
                volumeProgress.style.width = `${volume * 100}%`;
                
                // Update icon based on volume level
                if (volume === 0) {
                    volumeHighIcon.classList.add('hidden');
                    volumeMuteIcon.classList.remove('hidden');
                } else {
                    volumeHighIcon.classList.remove('hidden');
                    volumeMuteIcon.classList.add('hidden');
                }
            };
            
            // Event Listeners for Audio Player
            
            // Play/Pause button
            playPauseBtn.addEventListener('click', () => {
                if (audioElement.paused) {
                    if (audioElement.src) {
                        audioElement.play();
                        playIcon.classList.add('hidden');
                        pauseIcon.classList.remove('hidden');
                    } else if (playlist.length > 0) {
                        // If no song is loaded but we have songs in playlist
                        currentSongIndex = 0;
                        playSong(playlist[currentSongIndex]);
                    }
                } else {
                    pauseSong();
                }
            });
            
            // Previous button
            prevBtn.addEventListener('click', playPreviousSong);
            
            // Next button
            nextBtn.addEventListener('click', playNextSong);
            
            // Progress bar click
            progressContainer.addEventListener('click', setProgress);
            
            // Volume button (mute/unmute)
            volumeBtn.addEventListener('click', () => {
                if (audioElement.volume > 0) {
                    // Store the current volume for later
                    volumeBtn.dataset.previousVolume = audioElement.volume;
                    audioElement.volume = 0;
                    volumeProgress.style.width = '0%';
                    volumeHighIcon.classList.add('hidden');
                    volumeMuteIcon.classList.remove('hidden');
                } else {
                    // Restore previous volume or default to 1
                    const previousVolume = parseFloat(volumeBtn.dataset.previousVolume || 1);
                    audioElement.volume = previousVolume;
                    volumeProgress.style.width = `${previousVolume * 100}%`;
                    volumeHighIcon.classList.remove('hidden');
                    volumeMuteIcon.classList.add('hidden');
                }
            });
            
            // Volume slider
            let isAdjustingVolume = false;
            
            volumeSlider.addEventListener('mousedown', (e) => {
                isAdjustingVolume = true;
                handleVolumeChange(e);
            });
            
            volumeSlider.addEventListener('touchstart', (e) => {
                isAdjustingVolume = true;
                handleVolumeChange(e);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isAdjustingVolume) {
                    const rect = volumeSlider.getBoundingClientRect();
                    const relativeX = e.clientX - rect.left;
                    const width = volumeSlider.clientWidth;
                    const volume = Math.max(0, Math.min(1, relativeX / width));
                    
                    audioElement.volume = volume;
                    volumeProgress.style.width = `${volume * 100}%`;
                    
                    if (volume === 0) {
                        volumeHighIcon.classList.add('hidden');
                        volumeMuteIcon.classList.remove('hidden');
                    } else {
                        volumeHighIcon.classList.remove('hidden');
                        volumeMuteIcon.classList.add('hidden');
                    }
                }
            });
            
            document.addEventListener('touchmove', (e) => {
                if (isAdjustingVolume) {
                    e.preventDefault();
                    const rect = volumeSlider.getBoundingClientRect();
                    const relativeX = e.touches[0].clientX - rect.left;
                    const width = volumeSlider.clientWidth;
                    const volume = Math.max(0, Math.min(1, relativeX / width));
                    
                    audioElement.volume = volume;
                    volumeProgress.style.width = `${volume * 100}%`;
                    
                    if (volume === 0) {
                        volumeHighIcon.classList.add('hidden');
                        volumeMuteIcon.classList.remove('hidden');
                    } else {
                        volumeHighIcon.classList.remove('hidden');
                        volumeMuteIcon.classList.add('hidden');
                    }
                    
                    // Save volume to local storage
                    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
                }
            });
            
            document.addEventListener('mouseup', () => {
                isAdjustingVolume = false;
            });
            
            document.addEventListener('touchend', () => {
                isAdjustingVolume = false;
            });
            
            // Playlist button (toggle dropdown)
            playlistBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playlistDropdown.classList.toggle('active');
            });
            
            // Close playlist dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!playlistBtn.contains(e.target) && !playlistDropdown.contains(e.target)) {
                    playlistDropdown.classList.remove('active');
                }
            });
            
            // Clear playlist button
            document.getElementById('clear-playlist-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent closing the dropdown
                
                if (confirm('Are you sure you want to clear the current playlist?')) {
                    // Stop playback
                    pauseSong();
                    audioElement.src = '';
                    
                    // Clear current playlist
                    playlists[currentPlaylistId].songs = [];
                    currentSongIndex = -1;
                    updatePlaylistDisplay();
                    
                    // Mark player as inactive
                    audioPlayer.classList.remove('active');
                    audioPlayer.classList.add('inactive');
                    
                    // Save cleared playlist to storage
                    savePlaylistToStorage();
                    
                    // Reset UI
                    playerSongTitle.textContent = 'No song selected';
                    playerSongArtist.textContent = 'Select a song to play';
                    playerSongImage.src = 'https://placehold.co/500x500/1e293b/d1d5db?text=No+Song';
                    
                    showMessage('Playlist cleared', 'info');
                }
            });
            
            // Audio element events
            audioElement.addEventListener('timeupdate', updateProgress);
            
            audioElement.addEventListener('loadedmetadata', () => {
                totalTimeDisplay.textContent = formatTime(audioElement.duration);
            });
            
            audioElement.addEventListener('ended', () => {
                // Play next song when current one ends
                playNextSong();
            });
            
            // Save volume changes to local storage when changed
            audioElement.addEventListener('volumechange', () => {
                localStorage.setItem(STORAGE_KEYS.VOLUME, audioElement.volume.toString());
            });
            
            // Set default initial volume (will be overridden by saved volume if available)
            audioElement.volume = 0.7;
            volumeProgress.style.width = '70%';
            
            // Playlist management elements
            const playlistSelect = document.getElementById('playlist-select');
            const newPlaylistBtn = document.getElementById('new-playlist-btn');
            const savePlaylistBtn = document.getElementById('save-playlist-btn');
            
            // Handle playlist selection change
            if (playlistSelect) {
                playlistSelect.addEventListener('change', () => {
                    currentPlaylistId = playlistSelect.value;
                    currentSongIndex = -1; // Reset song index when switching playlists
                    updatePlaylistDisplay();
                    pauseSong();
                    
                    // Save the current playlist selection
                    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAYLIST, currentPlaylistId);
                });
            }
            
            // Create new playlist
            if (newPlaylistBtn) {
                newPlaylistBtn.addEventListener('click', () => {
                    const playlistName = prompt('Enter a name for your new playlist:');
                    if (playlistName && playlistName.trim()) {
                        const playlistId = 'playlist_' + Date.now();
                        playlists[playlistId] = {
                            name: playlistName.trim(),
                            songs: []
                        };
                        
                        // Switch to the new playlist
                        currentPlaylistId = playlistId;
                        
                        // Update UI
                        updatePlaylistSelector();
                        updatePlaylistDisplay();
                        
                        // Save to storage
                        savePlaylistToStorage();
                    }
                });
            }
            
            // Save/rename playlist
            if (savePlaylistBtn) {
                savePlaylistBtn.addEventListener('click', () => {
                    const currentPlaylistName = playlists[currentPlaylistId].name;
                    const newName = prompt('Rename your playlist:', currentPlaylistName);
                    
                    if (newName && newName.trim()) {
                        playlists[currentPlaylistId].name = newName.trim();
                        updatePlaylistSelector();
                        savePlaylistToStorage();
                        showMessage(`Playlist renamed to "${newName.trim()}"`, 'success');
                    }
                });
            }
            
            // Search icon toggle functionality
            if (topSearchIcon) {
                topSearchIcon.addEventListener('click', () => {
                    if (searchSection.classList.contains('hidden')) {
                        // Show search section with animation
                        searchSection.classList.remove('hidden');
                        setTimeout(() => {
                            searchSection.classList.remove('scale-y-0', 'opacity-0');
                            searchSection.classList.add('scale-y-100', 'opacity-100');
                            advancedFilters.classList.remove('hidden');
                            // Focus the search input
                            searchInput.focus();
                        }, 10);
                        
                        // Add active styling to the search icon
                        topSearchIcon.classList.add('bg-gray-700', 'text-white');
                    } else {
                        // Hide search section with animation
                        searchSection.classList.add('scale-y-0', 'opacity-0');
                        advancedFilters.classList.add('hidden');
                        setTimeout(() => {
                            searchSection.classList.add('hidden');
                        }, 300); // Match the duration in the CSS transition
                        
                        // Remove active styling from the search icon
                        topSearchIcon.classList.remove('bg-gray-700', 'text-white');
                    }
                });
            }
            
            // Load saved playlist and player state from local storage
            loadSavedPlaylist();
            
            // Initialize the player UI
            updatePlaylistDisplay();
            
            // Set initial player state
            const currentPlaylist = getCurrentPlaylist();
            if (currentSongIndex >= 0 && currentSongIndex < currentPlaylist.length) {
                audioPlayer.classList.add('active');
                audioPlayer.classList.remove('inactive');
            } else {
                audioPlayer.classList.add('inactive');
            }
        });