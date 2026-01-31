/**
 * Business Hub Platform - Common JavaScript Functions
 */

// Mobile Navigation Toggle – supports both injected and pre-existing .nav-toggle + .mobile-menu
function initMobileNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const mobileMenu = nav.querySelector('ul.mobile-menu');
    const menuToggle = nav.querySelector('.nav-toggle');
    const navList = nav.querySelector('ul:not(.mobile-menu)');
    if (!navList) return;

    function attachMobileNavBehavior(toggle, menu, list) {
        if (window.innerWidth <= 768) {
            list.style.display = 'none';
        }
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', isExpanded);
            toggle.setAttribute('aria-label', isExpanded ? 'Close menu' : 'Open menu');
            toggle.innerHTML = isExpanded ? '✕' : '☰';
        });
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && !nav.contains(e.target) && menu.classList.contains('active')) {
                menu.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Open menu');
                toggle.innerHTML = '☰';
            }
        });
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                menu.classList.remove('active');
                list.style.display = 'flex';
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-label', 'Open menu');
                toggle.innerHTML = '☰';
            } else {
                list.style.display = 'none';
            }
        });
    }

    // Pre-existing hamburger + mobile menu in HTML
    if (menuToggle && mobileMenu) {
        menuToggle.setAttribute('aria-label', 'Open menu');
        menuToggle.setAttribute('aria-expanded', 'false');
        attachMobileNavBehavior(menuToggle, mobileMenu, navList);
        return;
    }

    // Inject hamburger and cloned menu
    if (nav.querySelector('.nav-toggle')) return;

    const navListParent = navList.parentElement;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.innerHTML = '☰';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    const clonedMenu = navList.cloneNode(true);
    clonedMenu.classList.add('mobile-menu');
    if (navList.parentElement === nav) {
        nav.insertBefore(toggle, navList);
    } else {
        nav.insertBefore(toggle, navListParent);
    }
    nav.appendChild(clonedMenu);
    attachMobileNavBehavior(toggle, clonedMenu, navList);
}

// Set active page in navigation
function setActivePage() {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const navLinks = document.querySelectorAll('nav a[href]');

    navLinks.forEach(link => {
        const linkPath = new URL(link.getAttribute('href'), window.location.origin)
            .pathname.replace(/\/$/, '') || '/';
        if (linkPath === currentPath) {
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

// Load user avatar in navigation - Now uses API instead of localStorage
async function loadNavAvatar() {
    const profileLinks = document.querySelectorAll('nav .btn-profile');
    let avatarUrl = null;
    
    // Try to get avatar from API first (preferred method)
    const token = sessionStorage.getItem('userToken');
    if (token) {
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                if (userData.avatar_url) {
                    avatarUrl = userData.avatar_url;
                }
            }
        } catch (error) {
            console.error('Error loading avatar from API:', error);
            // Fall back to localStorage if API fails (backward compatibility)
            avatarUrl = localStorage.getItem('userAvatar');
        }
    } else {
        // No token, check localStorage as fallback (backward compatibility)
        avatarUrl = localStorage.getItem('userAvatar');
    }
    
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
        if (avatarUrl && avatarUrl.trim() !== '') {
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
            avatarImg.src = avatarUrl;
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
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userAuthenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('redirectAfterLogin');
    updateNavAuthStatus();
}

// Update navigation link based on authentication status
function updateNavAuthStatus() {
    const isAuthenticated = sessionStorage.getItem('userAuthenticated') === 'true';
    
    // Update main navigation links - try multiple selectors to catch all cases
    const selectors = [
        'nav a[href="/profile"]',
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
            link.href = '/login';
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
            link.href = '/profile';
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
        '.mobile-menu a[href="/profile"]',
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
            link.href = '/login';
            link.textContent = 'Login/Register';
            link.classList.remove('btn-profile');
            link.classList.add('btn-primary-link');
        } else {
            link.href = '/profile';
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
        { title: 'Home', url: '/' },
        { title: 'Events', url: '/eventspage' },
        { title: 'Blog', url: '/blog' },
        { title: 'Financial Calculators', url: '/tools' },
        { title: 'Directories', url: '/directories' },
        { title: 'Pitch Competition', url: '/pitch' },
        { title: 'FAQ', url: '/faq' },
        { title: 'Contact Us', url: '/contact' },
        { title: 'About Us', url: '/about' }
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

