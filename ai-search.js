// Groq API configuration
const GROQ_API_KEY = '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'; // Replace with your Groq API key
const API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORY_ITEMS = 10;

// Initialize search history from localStorage
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');

// Handle search function
async function handleSearch() {
    const searchInput = document.getElementById('aiSearch');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContent = document.getElementById('resultContent');
    const initialMessage = document.getElementById('initialMessage');
    const resultText = document.getElementById('resultText');
    const query = searchInput.value.trim();

    // Validate input
    if (!query) {
        showError('Please enter a search query');
        return;
    }

    // Hide initial message and show loading
    initialMessage.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    resultContent.classList.add('hidden');

    // Check cache first
    const cachedResponse = getCachedResponse(query);
    if (cachedResponse) {
        displayResponse(cachedResponse);
        loadingIndicator.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [
                    {
                        role: "system",
                        content: "You are a knowledgeable web development expert. Provide clear, detailed, and accurate answers to web development questions. Include practical code examples and best practices when relevant. Focus on modern web development technologies and techniques."
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                temperature: 0.5,
                max_tokens: 2048,
                top_p: 0.9,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Cache the response
        cacheResponse(query, aiResponse);
        
        // Update search history
        updateSearchHistory(query);

        // Format and display the response
        displayResponse(aiResponse);
    } catch (error) {
        showError('Error generating response. Please try again.');
        console.error('Search error:', error);
    } finally {
        // Always hide the loading indicator
        loadingIndicator.classList.add('hidden');
    }
}

// Cache management functions
function getCachedResponse(query) {
    const cache = JSON.parse(localStorage.getItem('aiSearchCache') || '{}');
    const cached = cache[query];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.response;
    }
    return null;
}

function cacheResponse(query, response) {
    const cache = JSON.parse(localStorage.getItem('aiSearchCache') || '{}');
    cache[query] = {
        response,
        timestamp: Date.now()
    };
    localStorage.setItem('aiSearchCache', JSON.stringify(cache));
}

// Search history management
function updateSearchHistory(query) {
    // Remove if already exists
    searchHistory = searchHistory.filter(item => item.query !== query);
    
    // Add to beginning
    searchHistory.unshift({
        query,
        timestamp: Date.now()
    });
    
    // Keep only the latest MAX_HISTORY_ITEMS
    searchHistory = searchHistory.slice(0, MAX_HISTORY_ITEMS);
    
    // Save to localStorage
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    
    // Update history display
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('searchHistory');
    if (!historyContainer) return;

    historyContainer.innerHTML = `
        <h3>Recent Searches</h3>
        ${searchHistory.map(item => `
            <div class="history-item" data-query="${item.query}">
                ${item.query}
            </div>
        `).join('')}
    `;

    // Add click handlers
    historyContainer.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('aiSearch').value = item.dataset.query;
            handleSearch();
        });
    });
}

// Display the AI response with syntax highlighting
function displayResponse(response) {
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Ensure loading indicator is hidden
    loadingIndicator.classList.add('hidden');
    
    // Convert markdown-style code blocks to HTML with language detection and copy button
    const formattedResponse = response
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            const trimmedCode = code.trim();
            
            // Skip empty code blocks and just return an empty string
            if (!trimmedCode || trimmedCode.length === 0) {
                return '';
            }
            
            // Only create code block if there's actual content
            return `
                <div class="code-block-container">
                    <div class="code-block-header">
                        <span class="code-language">${language}</span>
                        <button class="copy-code">Copy</button>
                    </div>
                    <pre><code class="language-${language}" data-language="${language}">${trimmedCode}</code></pre>
                </div>
            `;
        })
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        // Clean up any extra spaces or line breaks that might be left from removed code blocks
        .replace(/(<br\s*\/?>)\s*(<br\s*\/?>)+/g, '<br><br>') // Replace multiple line breaks with max two
        .replace(/^\s*(<br\s*\/?>)*\s*|\s*(<br\s*\/?>)*\s*$/g, ''); // Remove leading/trailing breaks

    // Add the result header with copy button
    resultContent.innerHTML = `
        <div class="result-header">
            <h3>Your result</h3>
            <button class="copy-result">Copy Result</button>
        </div>
        <div id="resultText">${formattedResponse}</div>
    `;
    resultContent.classList.remove('hidden');
}

// Show error message
function showError(message) {
    const resultContent = document.getElementById('resultContent');
    const resultText = document.getElementById('resultText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Ensure loading indicator is hidden
    loadingIndicator.classList.add('hidden');
    
    resultText.innerHTML = `<p class="error">${message}</p>`;
    resultContent.classList.remove('hidden');
}

// Handle enter key in search input
document.getElementById('aiSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Add copy button functionality for both code blocks and entire result
document.addEventListener('click', function(e) {
    if (e.target.matches('.copy-code')) {
        const codeBlock = e.target.nextElementSibling.querySelector('code');
        navigator.clipboard.writeText(codeBlock.textContent)
            .then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
            });
    } else if (e.target.matches('.copy-result')) {
        const resultText = document.getElementById('resultText');
        // Get all text content except code blocks
        const textContent = Array.from(resultText.childNodes)
            .filter(node => !node.classList?.contains('code-block-container'))
            .map(node => node.textContent)
            .join('\n')
            .trim();

        navigator.clipboard.writeText(textContent)
            .then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy Result';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy result:', err);
            });
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize search history display
    updateHistoryDisplay();
}); 