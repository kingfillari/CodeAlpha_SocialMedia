# CodeAlpha Social Media - Frontend

This is the frontend for the **CodeAlpha Social Media** platform, built with vanilla HTML, CSS, and JavaScript.

---

## Features

- **User Authentication**: Login and registration with JWT  
- **Feed**: View posts from followed users  
- **Posts**: Create, like, and comment on posts  
- **Profiles**: View and edit user profiles  
- **Follow System**: Follow/unfollow other users  
- **Search**: Search for users  
- **Responsive Design**: Works on desktop and mobile devices  

---

## Project Structure

CodeAlpha_SocialMedia/
│
├── backend/
│ ├── models/
│ │ ├── User.js # User schema and model
│ │ ├── Post.js # Post schema and model
│ │ ├── Comment.js # Comment schema and model
│ │ └── Follower.js # Follower relationship model
│ ├── routes/
│ │ ├── auth.js # Authentication routes
│ │ ├── posts.js # Post management routes
│ │ ├── comments.js # Comment routes
│ │ └── users.js # User profile routes
│ ├── middleware/
│ │ └── auth.js # JWT authentication middleware
│ ├── config/
│ │ └── database.js # Database connection setup
│ ├── package.json # Backend dependencies
│ └── server.js # Main server file
│
├── frontend/
│ ├── css/
│ │ ├── style.css # Main stylesheet
│ │ ├── auth.css # Authentication page styles
│ │ └── profile.css # Profile page styles
│ ├── js/
│ │ ├── app.js # Main application logic
│ │ ├── auth.js # Authentication handling
│ │ ├── posts.js # Post functionality
│ │ └── profile.js # Profile management
│ ├── index.html # Main feed page
│ ├── login.html # Login page
│ ├── register.html # Registration page
│ └── profile.html # User profile page
│
└── README.md

---

## 🎯 Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password  
2. **Login**: Sign in to your account  
3. **Create Profile**: Add personal information and a bio  
4. **Follow Users**: Find and follow other users  
5. **Create Posts**: Share your thoughts and images  
6. **Interact**: Like and comment on posts from users you follow  

### Key Features in Action

#### Creating a Post
1. Navigate to the main feed  
2. Type your content in the post textarea  
3. Optionally add an image by clicking "Add Image"  
4. Click "Post" to share with your followers  

#### Following Users
1. Visit other users' profiles  
2. Click the "Follow" button to see their posts in your feed  
3. Manage followers and following lists in your profile  

#### Interacting with Posts
- **Like**: Click the heart icon  
- **Comment**: Click the comment icon and type your response  
- **View Interactions**: See likes and comments on each post  

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the **backend** directory with the following:

```env
# Database connection string
MONGODB_URI=mongodb://localhost:27017/socialmedia

# JWT secret key for token encryption
JWT_SECRET=your_very_secure_secret_key_here

# Server port
PORT=5000

###Running the Project

cd backend
npm install
