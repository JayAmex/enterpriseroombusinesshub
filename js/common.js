/**
 * Business Hub Platform - Common JavaScript Functions
 */

// Mobile Navigation Toggle
function initMobileNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const navList = nav.querySelector('ul');
    if (!navList) return;
    
    // Check if mobile nav has already been initialized
    if (nav.querySelector('.nav-toggle')) return;
    
    // Find the parent container of the nav list (could be nav directly or a div inside nav)
    const navListParent = navList.parentElement;
    
    // Create mobile menu toggle button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'nav-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
    menuToggle.setAttribute('aria-expanded', 'false');
    
    // Clone nav list for mobile menu
    const mobileMenu = navList.cloneNode(true);
    mobileMenu.classList.add('mobile-menu');
    
    // Insert toggle button before the nav list (or its parent container)
    // If navList is a direct child of nav, insert before navList
    // Otherwise, insert before the parent container
    if (navList.parentElement === nav) {
        nav.insertBefore(menuToggle, navList);
    } else {
        // Insert before the parent container
        nav.insertBefore(menuToggle, navListParent);
    }
    
    // Append mobile menu to nav
    nav.appendChild(mobileMenu);
    
    // Hide original menu on mobile
    if (window.innerWidth <= 768) {
        navList.style.display = 'none';
    }
    
    // Toggle mobile menu
    menuToggle.addEventListener('click', function() {
        const isExpanded = mobileMenu.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
        menuToggle.innerHTML = isExpanded ? '✕' : '☰';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !nav.contains(e.target) && 
            mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.innerHTML = '☰';
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            mobileMenu.classList.remove('active');
            navList.style.display = 'flex';
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.innerHTML = '☰';
        } else {
            navList.style.display = 'none';
        }
    });
}

// Set active page in navigation
function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a[href]');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active-page');
        }
    });
}

// Back to Top Button
function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.setAttribute('title', 'Back to top');
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Add fade-in animation to elements
function initFadeIn() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.card, .content-item').forEach(el => {
        observer.observe(el);
    });
}

// Load user avatar in navigation
function loadNavAvatar() {
    const profileLinks = document.querySelectorAll('nav .btn-profile');
    const savedAvatar = localStorage.getItem('userAvatar');
    
    profileLinks.forEach(link => {
        // Get or create avatar text span
        let avatarText = link.querySelector('.nav-avatar-text');
        if (!avatarText) {
            // If no span exists, create one with the link's text
            const linkText = link.textContent.trim();
            avatarText = document.createElement('span');
            avatarText.className = 'nav-avatar-text';
            avatarText.textContent = linkText || 'My Profile';
            // Clear link content and add the span
            link.innerHTML = '';
            link.appendChild(avatarText);
        }
        
        // Get or create avatar image element
        let avatarImg = link.querySelector('.nav-avatar');
        if (!avatarImg) {
            avatarImg = document.createElement('img');
            avatarImg.className = 'nav-avatar';
            avatarImg.alt = 'Profile';
            avatarImg.style.display = 'none';
            // Insert avatar before text
            link.insertBefore(avatarImg, avatarText);
        }
        
        // Show avatar if available, otherwise show text
        if (savedAvatar && savedAvatar.trim() !== '') {
            avatarImg.onload = function() {
                // Image loaded successfully
                avatarImg.style.display = 'block';
                avatarImg.classList.add('show');
                avatarText.style.display = 'none';
                avatarText.classList.add('hide');
            };
            avatarImg.onerror = function() {
                // Image failed to load, show text instead
                avatarImg.style.display = 'none';
                avatarImg.classList.remove('show');
                avatarText.style.display = 'inline-block';
                avatarText.classList.remove('hide');
            };
            avatarImg.src = savedAvatar;
        } else {
            // No avatar saved, show text
            avatarImg.style.display = 'none';
            avatarImg.classList.remove('show');
            avatarText.style.display = 'inline-block';
            avatarText.classList.remove('hide');
        }
    });
}

// Initialize all features on page load
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Initialize features
    initMobileNav();
    setActivePage();
    initBackToTop();
    initFadeIn();
    
    // Update navigation based on authentication status
    updateNavAuthStatus();
    
    // Update navigation based on authentication status (ensure it runs)
    updateNavAuthStatus();
    
    // Load avatar with a small delay to ensure DOM is ready
    setTimeout(() => {
        loadNavAvatar();
        // Update nav status again after avatar loads
        updateNavAuthStatus();
    }, 100);
});

// Run navigation update immediately when script loads (before DOMContentLoaded)
(function() {
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
        // DOM is still loading, wait for it
        document.addEventListener('DOMContentLoaded', function() {
            updateNavAuthStatus();
            // Run again after a short delay to catch any late-rendered elements
            setTimeout(updateNavAuthStatus, 50);
        });
    } else {
        // DOM is already loaded, run immediately
        updateNavAuthStatus();
        setTimeout(updateNavAuthStatus, 50);
    }
})();

// Clear authentication (logout function)
function clearAuth() {
    sessionStorage.removeItem('userAuthenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('redirectAfterLogin');
    updateNavAuthStatus();
}

// Update navigation link based on authentication status
function updateNavAuthStatus() {
    const isAuthenticated = sessionStorage.getItem('userAuthenticated') === 'true';
    
    // Update main navigation links - try multiple selectors to catch all cases
    const selectors = [
        'nav a[href="profile.html"]',
        'nav .btn-profile',
        'nav a.btn-profile',
        'nav li a[href*="profile"]'
    ];
    
    let profileLinks = [];
    selectors.forEach(selector => {
        const links = document.querySelectorAll(selector);
        links.forEach(link => {
            if (!profileLinks.includes(link)) {
                profileLinks.push(link);
            }
        });
    });
    
    profileLinks.forEach(link => {
        if (!isAuthenticated) {
            // User not logged in - show Login/Register
            link.href = 'login.html';
            link.classList.remove('btn-profile');
            link.classList.add('btn-primary-link');
            
            // Remove avatar image if it exists
            const avatarImg = link.querySelector('.nav-avatar');
            if (avatarImg) {
                avatarImg.remove();
            }
            
            // Update text content - handle both span and direct text
            const textSpan = link.querySelector('.nav-avatar-text');
            if (textSpan) {
                textSpan.textContent = 'Login/Register';
            } else {
                // Remove all children and add new text
                link.innerHTML = '<span class="nav-avatar-text">Login/Register</span>';
            }
        } else {
            // User is logged in - show My Profile
            link.href = 'profile.html';
            link.classList.add('btn-profile');
            link.classList.remove('btn-primary-link');
            
            // Update text content
            const textSpan = link.querySelector('.nav-avatar-text');
            if (textSpan) {
                textSpan.textContent = 'My Profile';
            } else {
                // If no span exists, create one
                link.innerHTML = '<span class="nav-avatar-text">My Profile</span>';
            }
        }
    });
    
    // Also update mobile menu
    const mobileSelectors = [
        '.mobile-menu a[href="profile.html"]',
        '.mobile-menu .btn-profile',
        '.mobile-menu a.btn-profile'
    ];
    
    let mobileProfileLinks = [];
    mobileSelectors.forEach(selector => {
        const links = document.querySelectorAll(selector);
        links.forEach(link => {
            if (!mobileProfileLinks.includes(link)) {
                mobileProfileLinks.push(link);
            }
        });
    });
    
    mobileProfileLinks.forEach(link => {
        if (!isAuthenticated) {
            link.href = 'login.html';
            link.textContent = 'Login/Register';
            link.classList.remove('btn-profile');
            link.classList.add('btn-primary-link');
        } else {
            link.href = 'profile.html';
            link.textContent = 'My Profile';
            link.classList.add('btn-profile');
            link.classList.remove('btn-primary-link');
        }
    });
}

// Run immediately when script loads (before DOMContentLoaded)
(function() {
    // Try to update immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavAuthStatus);
    } else {
        updateNavAuthStatus();
    }
    
    // Also run after a short delay to catch any late-rendered elements
    setTimeout(updateNavAuthStatus, 50);
    setTimeout(updateNavAuthStatus, 200);
})();

// Utility function to format currency
function formatCurrency(amount, currency = 'NGN') {
    const symbols = {
        'NGN': '₦',
        'USD': '$',
        'GBP': '£'
    };
    
    const symbol = symbols[currency] || '';
    
    return symbol + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Tab switching functionality
function switchTab(tabButtons, tabContents, activeTabId) {
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    const activeButton = Array.from(tabButtons).find(btn => 
        btn.getAttribute('data-tab') === activeTabId || 
        btn.onclick?.toString().includes(activeTabId)
    );
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const activeContent = document.getElementById(activeTabId);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// Global Search Functionality
function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    // Simple search results (can be enhanced with actual data)
    const results = [];
    
    // Search pages
    const pages = [
        { title: 'Home', url: 'index.html' },
        { title: 'Events', url: 'eventspage.html' },
        { title: 'Blog', url: 'blog.html' },
        { title: 'Financial Calculators', url: 'tools.html' },
        { title: 'Directories', url: 'directories.html' },
        { title: 'Pitch Competition', url: 'pitch.html' },
        { title: 'FAQ', url: 'faq.html' },
        { title: 'Contact Us', url: 'contact.html' },
        { title: 'About Us', url: 'about.html' }
    ];
    
    pages.forEach(page => {
        if (page.title.toLowerCase().includes(searchTerm)) {
            results.push({ type: 'Page', title: page.title, url: page.url });
        }
    });
    
    // Display results
    if (results.length > 0) {
        resultsDiv.innerHTML = results.map(r => 
            `<a href="${r.url}" style="display: block; padding: 12px; border-bottom: 1px solid var(--border); text-decoration: none; color: var(--text);"><strong>${r.title}</strong><br><small style="color: var(--text-light);">${r.type}</small></a>`
        ).join('');
        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.innerHTML = '<div style="padding: 12px; color: var(--text-light);">No results found</div>';
        resultsDiv.style.display = 'block';
    }
}

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    const searchInput = document.getElementById('globalSearch');
    const resultsDiv = document.getElementById('searchResults');
    if (searchInput && resultsDiv && !searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
        resultsDiv.style.display = 'none';
    }
});

