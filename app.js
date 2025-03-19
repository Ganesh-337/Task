import { supabase } from './supabase-config.js';

// DOM Elements
const elements = {
    pages: {
        home: document.getElementById('homePage'),
        login: document.getElementById('loginPage'),
        register: document.getElementById('registerPage'),
        landing: document.getElementById('landingPage')
    },
    forms: {
        login: document.getElementById('loginForm'),
        register: document.getElementById('registerForm')
    },
    errors: {
        login: document.getElementById('loginErrorMessage'),
        register: document.getElementById('registerErrorMessage')
    },
    menu: {
        toggle: document.getElementById('menuToggle'),
        side: document.getElementById('sideMenu'),
        items: document.querySelectorAll('.menu-item'),
        search: document.querySelector('.menu-search input')
    },
    content: {
        main: document.querySelector('.main-content'),
        topNav: document.querySelector('.top-nav'),
        userWelcome: document.getElementById('userWelcome'),
        profileName: document.getElementById('profileName')
    }
};

// Navigation Functions
function showPage(pageId) {
    Object.values(elements.pages).forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

// Menu Functions
function initializeMenu() {
    // Toggle menu
    elements.menu.toggle.addEventListener('click', () => {
        elements.menu.side.classList.toggle('open');
        elements.menu.toggle.classList.toggle('open');
        elements.content.main.classList.toggle('menu-open');
        elements.content.topNav.classList.toggle('menu-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.menu.side.contains(e.target) && 
            !elements.menu.toggle.contains(e.target) && 
            elements.menu.side.classList.contains('open')) {
            elements.menu.side.classList.remove('open');
            elements.menu.toggle.classList.remove('open');
            elements.content.main.classList.remove('menu-open');
            elements.content.topNav.classList.remove('menu-open');
        }
    });

    // Handle menu item clicks
    elements.menu.items.forEach(item => {
        item.addEventListener('click', () => {
            elements.menu.items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            if (window.innerWidth <= 768) {
                elements.menu.side.classList.remove('open');
                elements.menu.toggle.classList.remove('open');
                elements.content.main.classList.remove('menu-open');
                elements.content.topNav.classList.remove('menu-open');
            }
        });
    });

    // Handle menu search
    elements.menu.search.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        elements.menu.items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // if(email && password) {
    //     console.log('User logged in successfully');
    //     showPage('landingPage');
    // }else {
    //     console.log('Error logging in:', error);
    // }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        updateUserInterface(data.user);
        showPage('landingPage');
    } catch (error) {
        elements.errors.login.textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        elements.errors.register.textContent = "Passwords do not match";
        return;
    }

    // if(email && password && confirmPassword && password === confirmPassword) {
    //     console.log('User registered successfully');
    //     showPage('landingPage');
    // }else {
    //     console.log('Error registering user:', error);
    // }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) throw error;

        elements.errors.register.textContent = "Registration successful! Please check your email to verify your account.";
    } catch (error) {
        elements.errors.register.textContent = error.message;
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showPage('homePage');
    } catch (error) {
        console.error('Error logging out:', error.message);
    }
}

// UI Update Functions
function updateUserInterface(user) {
    if (user) {
        elements.content.userWelcome.textContent = `Welcome, ${user.email}!`;
        elements.content.profileName.textContent = user.email;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize menu
    initializeMenu();

    // Auth event listeners
    elements.forms.login.addEventListener('submit', handleLogin);
    elements.forms.register.addEventListener('submit', handleRegister);

    // Navigation event listeners
    document.querySelectorAll('[data-nav]').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-nav');
            if (target === 'logout') {
                handleLogout();
            } else {
                showPage(`${target}Page`);
            }
        });
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            updateUserInterface(session.user);
            showPage('landingPage');
        }
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            updateUserInterface(session.user);
            showPage('landingPage');
        } else if (event === 'SIGNED_OUT') {
            showPage('homePage');
        }
    });
}); 