// Global variables
let currentPage = 1;
let currentUserId = null;
let isOwnProfile = true;

// Initialize app
async function initApp() {
    await loadUserData();
    await loadFeed();
    await loadSuggestedUsers();
}

// Load user data
async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Update stored user
            updateStoredUser(user);
            
            // Update UI elements
            updateUserUI(user);
        } else {
            throw new Error('Failed to load user data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showMessage('Error loading user data', 'error');
    }
}

// Update user UI elements
function updateUserUI(user) {
    // Update navigation and general user info
    const avatar = user.profile.avatar || 'https://via.placeholder.com/100';
    const fullName = `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user.username;
    
    // Update elements that exist on the page
    const userAvatar = document.getElementById('userAvatar');
    const currentUserAvatar = document.getElementById('currentUserAvatar');
    const userName = document.getElementById('userName');
    const userBio = document.getElementById('userBio');
    const postsCount = document.getElementById('postsCount');
    const followersCount = document.getElementById('followersCount');
    const followingCount = document.getElementById('followingCount');
    
    if (userAvatar) userAvatar.src = avatar;
    if (currentUserAvatar) currentUserAvatar.src = avatar;
    if (userName) userName.textContent = fullName;
    if (userBio) userBio.textContent = user.profile.bio || 'No bio yet.';
    if (postsCount) postsCount.textContent = user.postsCount || 0;
    if (followersCount) followersCount.textContent = user.followersCount || 0;
    if (followingCount) followingCount.textContent = user.followingCount || 0;
}

// Search users
async function searchUsers() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) return;
    
    try {
        const response = await fetch(`${API_BASE}/users?search=${encodeURIComponent(query)}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const users = await response.json();
            displaySearchResults(users);
        }
    } catch (error) {
        console.error('Search error:', error);
        showMessage('Error searching users', 'error');
    }
}

// Display search results
function displaySearchResults(users) {
    const modal = document.getElementById('searchModal');
    const resultsContainer = document.getElementById('searchResults');
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="text-center">No users found</div>';
    } else {
        resultsContainer.innerHTML = users.map(user => `
            <div class="suggestion-item">
                <img src="${user.profile.avatar || 'https://via.placeholder.com/50'}" 
                     alt="${user.username}" class="avatar-small">
                <div class="suggestion-info">
                    <div class="suggestion-name">${user.profile.firstName || ''} ${user.profile.lastName || ''}</div>
                    <div class="suggestion-followers">@${user.username} • ${user.followersCount || 0} followers</div>
                </div>
                <button class="btn-primary" onclick="viewUserProfile('${user._id || user.id}')">
                    View Profile
                </button>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

// Close search modal
function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
}

// View user profile
function viewUserProfile(userId) {
    window.location.href = `profile.html?userId=${userId}`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('searchModal');
    if (event.target === modal) {
        closeSearchModal();
    }
    
    const editModal = document.getElementById('editProfileModal');
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('userAvatar')) {
        initApp();
    }
});