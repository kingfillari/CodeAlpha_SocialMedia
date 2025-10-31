// Load feed posts
async function loadFeed(page = 1) {
    try {
        const response = await fetch(`${API_BASE}/posts?page=${page}&limit=10`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayPosts(data.posts, page);
            
            // Show/hide load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                if (page < data.totalPages) {
                    loadMoreBtn.style.display = 'block';
                    currentPage = page;
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } else {
            throw new Error('Failed to load posts');
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        document.getElementById('feed').innerHTML = '<div class="error">Error loading posts</div>';
    }
}

// Load more posts
function loadMorePosts() {
    loadFeed(currentPage + 1);
}

// Display posts
function displayPosts(posts, page = 1) {
    const feed = document.getElementById('feed');
    
    if (posts.length === 0) {
        if (page === 1) {
            feed.innerHTML = `
                <div class="text-center">
                    <h3>No posts yet</h3>
                    <p>Be the first to post something!</p>
                </div>
            `;
        }
        return;
    }
    
    const postsHTML = posts.map(post => createPostHTML(post)).join('');
    
    if (page === 1) {
        feed.innerHTML = postsHTML;
    } else {
        feed.innerHTML += postsHTML;
    }
}

// Create post HTML
function createPostHTML(post) {
    const user = post.user;
    const currentUser = getCurrentUser();
    const isOwnPost = currentUser && currentUser.id === post.user._id;
    const isLiked = post.likes.some(like => like.user === currentUser.id);
    const postDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="post-card" id="post-${post._id}">
            <div class="post-header">
                <img src="${user.profile.avatar || 'https://via.placeholder.com/50'}" 
                     alt="${user.username}" class="avatar-small">
                <div class="post-user-info">
                    <h4>${user.profile.firstName || ''} ${user.profile.lastName || ''}</h4>
                    <div class="post-time">${postDate}</div>
                </div>
                ${isOwnPost ? `
                    <div class="post-actions-dropdown">
                        <button class="btn-secondary" onclick="togglePostMenu('${post._id}')">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="dropdown-menu" id="menu-${post._id}" style="display: none;">
                            <button onclick="editPost('${post._id}')">Edit</button>
                            <button onclick="deletePost('${post._id}')" class="danger">Delete</button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-content">
                ${post.content}
            </div>
            
            ${post.image ? `
                <img src="${post.image}" alt="Post image" class="post-image">
            ` : ''}
            
            <div class="post-stats">
                <span>${post.likesCount} likes</span>
                <span>${post.commentsCount} comments</span>
            </div>
            
            <div class="post-actions">
                <button class="post-action-btn ${isLiked ? 'liked' : ''}" 
                        onclick="likePost('${post._id}')">
                    <i class="fas fa-heart"></i> Like
                </button>
                <button class="post-action-btn" onclick="focusComment('${post._id}')">
                    <i class="fas fa-comment"></i> Comment
                </button>
            </div>
            
            <div class="comments-section">
                <div id="comments-${post._id}">
                    <!-- Comments will be loaded here when needed -->
                </div>
                <div class="add-comment">
                    <input type="text" id="commentInput-${post._id}" 
                           placeholder="Write a comment..." 
                           onkeypress="if(event.key === 'Enter') addComment('${post._id}')">
                    <button onclick="addComment('${post._id}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create post
async function createPost() {
    const contentInput = document.getElementById('postContent');
    const content = contentInput.value.trim();
    
    if (!content) {
        showMessage('Please write something to post', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            const data = await response.json();
            showMessage('Post created successfully!', 'success');
            contentInput.value = '';
            
            // Reload feed to show new post
            loadFeed(1);
            
            // Update user posts count
            await loadUserData();
        } else {
            throw new Error('Failed to create post');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage('Error creating post', 'error');
    }
}

// Like/unlike post
async function likePost(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/like/${postId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update like button and count
            const likeBtn = document.querySelector(`#post-${postId} .post-action-btn`);
            const postStats = document.querySelector(`#post-${postId} .post-stats`);
            
            if (likeBtn && postStats) {
                if (data.liked) {
                    likeBtn.classList.add('liked');
                    likeBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
                } else {
                    likeBtn.classList.remove('liked');
                    likeBtn.innerHTML = '<i class="fas fa-heart"></i> Like';
                }
                
                // Update likes count
                const likesSpan = postStats.querySelector('span:first-child');
                if (likesSpan) {
                    likesSpan.textContent = `${data.likesCount} likes`;
                }
            }
        }
    } catch (error) {
        console.error('Error liking post:', error);
        showMessage('Error updating like', 'error');
    }
}

// Add comment
async function addComment(postId) {
    const commentInput = document.getElementById(`commentInput-${postId}`);
    const content = commentInput.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ postId, content })
        });

        if (response.ok) {
            const data = await response.json();
            commentInput.value = '';
            
            // Reload comments
            await loadComments(postId);
            
            // Update comments count
            const postStats = document.querySelector(`#post-${postId} .post-stats`);
            if (postStats) {
                const commentsSpan = postStats.querySelector('span:last-child');
                if (commentsSpan) {
                    const currentCount = parseInt(commentsSpan.textContent) || 0;
                    commentsSpan.textContent = `${currentCount + 1} comments`;
                }
            }
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showMessage('Error adding comment', 'error');
    }
}

// Load comments for a post
async function loadComments(postId) {
    try {
        const response = await fetch(`${API_BASE}/comments/post/${postId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayComments(postId, data.comments);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Display comments
function displayComments(postId, comments) {
    const commentsContainer = document.getElementById(`comments-${postId}`);
    
    if (comments.length === 0) {
        commentsContainer.innerHTML = '<div class="text-center">No comments yet</div>';
        return;
    }
    
    const commentsHTML = comments.map(comment => `
        <div class="comment">
            <img src="${comment.user.profile.avatar || 'https://via.placeholder.com/40'}" 
                 alt="${comment.user.username}" class="avatar-small">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-user">${comment.user.profile.firstName || ''} ${comment.user.profile.lastName || ''}</span>
                    <span class="comment-time">${new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `).join('');
    
    commentsContainer.innerHTML = commentsHTML;
}

// Focus comment input
function focusComment(postId) {
    const commentInput = document.getElementById(`commentInput-${postId}`);
    if (commentInput) {
        commentInput.focus();
        
        // Load comments if not loaded
        const commentsContainer = document.getElementById(`comments-${postId}`);
        if (commentsContainer.children.length === 0) {
            loadComments(postId);
        }
    }
}

// Load suggested users
async function loadSuggestedUsers() {
    try {
        const response = await fetch(`${API_BASE}/users?limit=5`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const users = await response.json();
            displaySuggestedUsers(users);
        }
    } catch (error) {
        console.error('Error loading suggested users:', error);
    }
}

// Display suggested users
function displaySuggestedUsers(users) {
    const container = document.getElementById('suggestedUsers');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="text-center">No suggestions</div>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="suggestion-item">
            <img src="${user.profile.avatar || 'https://via.placeholder.com/50'}" 
                 alt="${user.username}" class="avatar-small">
            <div class="suggestion-info">
                <div class="suggestion-name">${user.profile.firstName || ''} ${user.profile.lastName || ''}</div>
                <div class="suggestion-followers">${user.followersCount || 0} followers</div>
            </div>
            <button class="btn-primary" onclick="followUser('${user._id || user.id}')">
                Follow
            </button>
        </div>
    `).join('');
    
    container.innerHTML = usersHTML;
}

// Follow user
async function followUser(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/follow/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            showMessage(data.message, 'success');
            
            // Reload suggestions and user data
            await loadSuggestedUsers();
            await loadUserData();
        }
    } catch (error) {
        console.error('Error following user:', error);
        showMessage('Error following user', 'error');
    }
}

// Post menu functions (for edit/delete)
function togglePostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showMessage('Post deleted successfully', 'success');
            document.getElementById(`post-${postId}`).remove();
            
            // Update user posts count
            await loadUserData();
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showMessage('Error deleting post', 'error');
    }
}

function editPost(postId) {
    // Implementation for editing posts
    showMessage('Edit feature coming soon!', 'info');
}