// Initialize profile
async function initProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (userId) {
        // Viewing another user's profile
        currentUserId = userId;
        isOwnProfile = false;
        await loadUserProfile(userId);
    } else {
        // Viewing own profile
        currentUserId = getCurrentUser().id;
        isOwnProfile = true;
        await loadOwnProfile();
    }
    
    // Load user's posts
    await loadUserPosts(currentUserId);
    
    // Show posts tab by default
    showTab('posts');
}

// Load own profile
async function loadOwnProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayProfile(data.user);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Error loading profile', 'error');
    }
}

// Load another user's profile
async function loadUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayProfile(data.user);
            
            // Check if current user is following this user
            checkFollowStatus(userId);
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showMessage('User not found', 'error');
        window.location.href = 'index.html';
    }
}

// Display profile
function displayProfile(user) {
    const avatar = user.profile.avatar || 'https://via.placeholder.com/150';
    const fullName = `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user.username;
    
    // Update profile header
    document.getElementById('profileAvatar').src = avatar;
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profileBio').textContent = user.profile.bio || 'No bio yet.';
    document.getElementById('profilePostsCount').textContent = user.postsCount || 0;
    document.getElementById('profileFollowersCount').textContent = user.followersCount || 0;
    document.getElementById('profileFollowingCount').textContent = user.followingCount || 0;
    
    // Update about tab
    document.getElementById('aboutUsername').textContent = user.username;
    document.getElementById('aboutEmail').textContent = user.email;
    document.getElementById('aboutLocation').textContent = user.profile.location || 'Not specified';
    document.getElementById('aboutWebsite').textContent = user.profile.website || 'Not specified';
    document.getElementById('aboutBio').textContent = user.profile.bio || 'No bio yet.';
    
    // Show/hide edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    const followBtn = document.getElementById('followBtn');
    
    if (isOwnProfile) {
        editProfileBtn.style.display = 'block';
        followBtn.style.display = 'none';
    } else {
        editProfileBtn.style.display = 'none';
        followBtn.style.display = 'block';
    }
}

// Check follow status
async function checkFollowStatus(userId) {
    try {
        const currentUser = getCurrentUser();
        // This is a simplified check - in a real app, you'd have an endpoint for this
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const isFollowing = data.user.followers.some(follower => follower._id === currentUser.id);
            
            const followBtn = document.getElementById('followBtn');
            if (isFollowing) {
                followBtn.textContent = 'Unfollow';
                followBtn.classList.remove('btn-primary');
                followBtn.classList.add('btn-secondary');
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('btn-secondary');
                followBtn.classList.add('btn-primary');
            }
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

// Toggle follow/unfollow
async function toggleFollow() {
    if (!currentUserId) return;
    
    try {
        const followBtn = document.getElementById('followBtn');
        const isCurrentlyFollowing = followBtn.textContent === 'Unfollow';
        
        const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
        const response = await fetch(`${API_BASE}/users/${endpoint}/${currentUserId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            showMessage(data.message, 'success');
            
            // Update follow button and reload profile
            await checkFollowStatus(currentUserId);
            await loadUserProfile(currentUserId);
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        showMessage('Error updating follow status', 'error');
    }
}

// Load user posts
async function loadUserPosts(userId) {
    try {
        const response = await fetch(`${API_BASE}/posts/user/${userId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayUserPosts(data.posts);
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
        document.getElementById('userPosts').innerHTML = '<div class="error">Error loading posts</div>';
    }
}

// Display user posts
function displayUserPosts(posts) {
    const container = document.getElementById('userPosts');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <h3>No posts yet</h3>
                <p>${isOwnProfile ? 'Share your first post!' : 'This user hasn\'t posted anything yet.'}</p>
            </div>
        `;
        return;
    }
    
    const postsHTML = posts.map(post => createPostHTML(post)).join('');
    container.innerHTML = postsHTML;
}

// Tab navigation
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab and activate button
    document.getElementById(`${tabName}Tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Load tab content if needed
    if (tabName === 'followers') {
        loadFollowers();
    } else if (tabName === 'following') {
        loadFollowing();
    }
}

// Load followers
async function loadFollowers() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayFollowers(data.user.followers);
        }
    } catch (error) {
        console.error('Error loading followers:', error);
        document.getElementById('followersContainer').innerHTML = '<div class="error">Error loading followers</div>';
    }
}

// Display followers
function displayFollowers(followers) {
    const container = document.getElementById('followersContainer');
    
    if (!followers || followers.length === 0) {
        container.innerHTML = '<div class="text-center">No followers yet</div>';
        return;
    }
    
    const followersHTML = followers.map(follower => `
        <div class="follower-item">
            <img src="${follower.profile.avatar || 'https://via.placeholder.com/50'}" 
                 alt="${follower.username}" class="avatar-small">
            <div class="follower-info">
                <div class="follower-name">${follower.profile.firstName || ''} ${follower.profile.lastName || ''}</div>
                <div class="follower-username">@${follower.username}</div>
            </div>
            <div class="follower-actions">
                <button class="btn-primary" onclick="viewUserProfile('${follower._id}')">
                    View Profile
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = followersHTML;
}

// Load following
async function loadFollowing() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayFollowing(data.user.following);
        }
    } catch (error) {
        console.error('Error loading following:', error);
        document.getElementById('followingContainer').innerHTML = '<div class="error">Error loading following</div>';
    }
}

// Display following
function displayFollowing(following) {
    const container = document.getElementById('followingContainer');
    
    if (!following || following.length === 0) {
        container.innerHTML = '<div class="text-center">Not following anyone yet</div>';
        return;
    }
    
    const followingHTML = following.map(user => `
        <div class="following-item">
            <img src="${user.profile.avatar || 'https://via.placeholder.com/50'}" 
                 alt="${user.username}" class="avatar-small">
            <div class="following-info">
                <div class="following-name">${user.profile.firstName || ''} ${user.profile.lastName || ''}</div>
                <div class="following-username">@${user.username}</div>
            </div>
            <div class="following-actions">
                <button class="btn-primary" onclick="viewUserProfile('${user._id}')">
                    View Profile
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = followingHTML;
}

// Edit profile
function editProfile() {
    const user = getCurrentUser();
    
    // Fill form with current data
    document.getElementById('editFirstName').value = user.profile.firstName || '';
    document.getElementById('editLastName').value = user.profile.lastName || '';
    document.getElementById('editBio').value = user.profile.bio || '';
    document.getElementById('editLocation').value = user.profile.location || '';
    document.getElementById('editWebsite').value = user.profile.website || '';
    
    // Show modal
    document.getElementById('editProfileModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

// Save profile changes
async function saveProfileChanges(formData) {
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            showMessage('Profile updated successfully!', 'success');
            
            // Update stored user and UI
            updateStoredUser(data.user);
            displayProfile(data.user);
            closeEditModal();
            
            // Reload main app data if we're on the index page
            if (window.location.pathname.includes('index.html')) {
                await loadUserData();
            }
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    }
}

// Edit avatar (placeholder)
function editAvatar() {
    showMessage('Avatar upload feature coming soon!', 'info');
}

// Handle edit profile form submission
if (document.getElementById('editProfileForm')) {
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            firstName: document.getElementById('editFirstName').value,
            lastName: document.getElementById('editLastName').value,
            bio: document.getElementById('editBio').value,
            location: document.getElementById('editLocation').value,
            website: document.getElementById('editWebsite').value
        };
        
        await saveProfileChanges(formData);
    });
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('profileName')) {
        initProfile();
    }
});