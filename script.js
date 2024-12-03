// Global variables
const BASE_API_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php?a=';
const menuContainer = document.getElementById('menu-container');
const searchInput = document.getElementById('searchInput');
const sortFilter = document.getElementById('sortFilter');
const loadingSpinner = document.getElementById('loading');
const cartModal = document.getElementById('cartModal');
const authModal = document.getElementById('authModal');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');

let cart = [];
let currentCuisine = 'Indian';
let allMeals = [];
const DELIVERY_FEE = 40;
const USD_TO_INR_RATE = 83;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Sample meal data for when API is rate limited
const SAMPLE_MEALS = {
    'Indian': [
        { idMeal: '1', strMeal: 'Butter Chicken', strMealThumb: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=500&h=500', strArea: 'Indian' },
        { idMeal: '2', strMeal: 'Paneer Tikka', strMealThumb: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=500&h=500', strArea: 'Indian' },
        { idMeal: '3', strMeal: 'Dal Makhani', strMealThumb: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&h=500', strArea: 'Indian' }
    ],
    'Chinese': [
        { idMeal: '4', strMeal: 'Kung Pao Chicken', strMealThumb: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=500&h=500', strArea: 'Chinese' },
        { idMeal: '5', strMeal: 'Dim Sum', strMealThumb: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&h=500', strArea: 'Chinese' }
    ],
    'Mexican': [
        { idMeal: '6', strMeal: 'Tacos', strMealThumb: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&h=500', strArea: 'Mexican' },
        { idMeal: '7', strMeal: 'Enchiladas', strMealThumb: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=500&h=500', strArea: 'Mexican' }
    ],
    'Italian': [
        { idMeal: '8', strMeal: 'Margherita Pizza', strMealThumb: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=500&h=500', strArea: 'Italian' },
        { idMeal: '9', strMeal: 'Pasta Carbonara', strMealThumb: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=500&h=500', strArea: 'Italian' }
    ],
    'Thai': [
        { idMeal: '10', strMeal: 'Pad Thai', strMealThumb: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=500&h=500', strArea: 'Thai' },
        { idMeal: '11', strMeal: 'Green Curry', strMealThumb: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=500&h=500', strArea: 'Thai' }
    ],
    'Japanese': [
        { idMeal: '12', strMeal: 'Sushi Roll', strMealThumb: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=500&h=500', strArea: 'Japanese' },
        { idMeal: '13', strMeal: 'Ramen', strMealThumb: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=500&h=500', strArea: 'Japanese' }
    ]
};

// Authentication related variables
let isLoggedIn = false;
let currentUser = null;
let isSignupMode = false;
let isUserMenuOpen = false;

// Auth Functions
function toggleAuth() {
    if (!authModal) return;
    authModal.classList.toggle('active');
    document.body.style.overflow = authModal.classList.contains('active') ? 'hidden' : '';
}

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    const authForm = document.getElementById('authForm');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authSwitch = document.getElementById('authSwitch');
    const authSwitchBtn = authSwitch.nextElementSibling;

    if (isSignupMode) {
        authForm.classList.add('signup');
        authTitle.textContent = 'Create Account';
        authSubmitBtn.textContent = 'Sign Up';
        authSwitch.textContent = 'Already have an account? ';
        authSwitchBtn.textContent = 'Login';
    } else {
        authForm.classList.remove('signup');
        authTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        authSwitch.textContent = "Don't have an account? ";
        authSwitchBtn.textContent = 'Sign Up';
    }
}

function toggleUserMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;
    
    isUserMenuOpen = !isUserMenuOpen;
    
    if (isUserMenuOpen) {
        userMenu.style.opacity = '1';
        userMenu.style.visibility = 'visible';
        userMenu.style.transform = 'translateY(0)';
    } else {
        userMenu.style.opacity = '0';
        userMenu.style.visibility = 'hidden';
        userMenu.style.transform = 'translateY(10px)';
    }
}

function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (isSignupMode) {
        const name = document.getElementById('name').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }
        
        // In a real app, you would make an API call to create the account
        currentUser = {
            name,
            email,
            orders: []
        };
        
        showNotification('Account created successfully! 🎉');
    } else {
        // In a real app, you would make an API call to verify credentials
        currentUser = {
            name: email.split('@')[0],
            email,
            orders: []
        };
        
        showNotification('Welcome back! 👋');
    }
    
    isLoggedIn = true;
    localStorage.setItem('foodieHubUser', JSON.stringify(currentUser));
    updateAuthUI();
    toggleAuth();
}

function updateAuthUI() {
    const userProfile = document.querySelector('.user-profile');
    const userDisplayName = document.getElementById('userDisplayName');
    
    if (isLoggedIn && currentUser) {
        userProfile.classList.add('logged-in');
        userProfile.classList.remove('logged-out');
        userDisplayName.textContent = currentUser.name;
        document.querySelector('.user-profile i').className = 'fas fa-user-circle';
    } else {
        userProfile.classList.add('logged-out');
        userProfile.classList.remove('logged-in');
        userDisplayName.textContent = 'Guest';
        document.querySelector('.user-profile i').className = 'fas fa-user';
    }
}

function viewProfile() {
    if (!isLoggedIn) {
        showNotification('Please login to view your profile');
        toggleAuth();
        return;
    }
    
    alert(`
👤 Profile Information
─────────────────────
Name: ${currentUser.name}
Email: ${currentUser.email}
Member Since: ${new Date().toLocaleDateString()}
    `);
}

function viewOrders() {
    if (!isLoggedIn) {
        showNotification('Please login to view your orders');
        toggleAuth();
        return;
    }
    
    if (!currentUser.orders || currentUser.orders.length === 0) {
        alert('No order history available');
        return;
    }
    
    const orderHistory = currentUser.orders.map((order, index) => `
Order #${index + 1}
───────────
Date: ${order.date}
Items: ${order.items.length}
Total: ₹${order.total}
    `).join('\n');
    
    alert(`
📋 Order History
──────────────
${orderHistory}
    `);
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('foodieHubUser');
    updateAuthUI();
    showNotification('Logged out successfully');
}

// Cart Functions
function addToCart(id, name, price, image, rating) {
    const existingItem = cart.find(item => item.id === id);
    const button = document.querySelector(`[data-id="${id}"] .add-to-cart-btn`);
    
    if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Added';
        button.style.background = '#4CAF50';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            button.style.background = '';
        }, 1500);
    }
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, image, rating, quantity: 1 });
    }
    
    localStorage.setItem('foodieHubCart', JSON.stringify(cart));
    updateCartUI();
    showNotification(`${name} added to cart!`);
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartSubtotal || !cartTotal) return;
    
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQuantity;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartSubtotal.textContent = '₹0';
        cartTotal.textContent = '₹0';
        return;
    }
    
    const itemsHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="price">₹${formatIndianPrice(item.price)}</div>
                <div class="quantity">
                    <button onclick="updateQuantity('${item.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
    
    cartItems.innerHTML = itemsHTML;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;
    
    cartSubtotal.textContent = `₹${formatIndianPrice(subtotal)}`;
    cartTotal.textContent = `₹${formatIndianPrice(total)}`;
    
    localStorage.setItem('foodieHubCart', JSON.stringify(cart));
}

function toggleCart() {
    if (!cartModal) return;
    cartModal.classList.toggle('active');
    document.body.style.overflow = cartModal.classList.contains('active') ? 'hidden' : '';
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            removeFromCart(id);
        }
        updateCartUI();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    showNotification('Item removed from cart');
}

function checkout() {
    if (!isLoggedIn) {
        showNotification('Please login to place an order');
        toggleAuth();
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + DELIVERY_FEE;
    const orderNumber = `FH${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const currentTime = new Date();
    const deliveryTime = new Date(currentTime.getTime() + 45 * 60000);
    
    // Save order to user history
    if (!currentUser.orders) currentUser.orders = [];
    currentUser.orders.push({
        id: orderNumber,
        date: currentTime.toLocaleString(),
        items: [...cart],
        total: total
    });
    localStorage.setItem('foodieHubUser', JSON.stringify(currentUser));
    
    const orderSummary = cart.map(item => 
        `🍽️ ${item.name}\n   Quantity: ${item.quantity}\n   Amount: ₹${formatIndianPrice(item.price * item.quantity)}\n`
    ).join('\n');
    
    const message = `
✨ Sonali's FOODIEHUB - ORDER CONFIRMATION ✨
═══════════════════════════════════

📋 ORDER DETAILS
───────────────
Order Number: #${orderNumber}
Order Time: ${currentTime.toLocaleTimeString()}
Expected Delivery: ${deliveryTime.toLocaleTimeString()}

🛒 YOUR ORDER
───────────
${orderSummary}
📊 BILL SUMMARY
─────────────
Items Subtotal: ₹${formatIndianPrice(total - DELIVERY_FEE)}
Delivery Fee:   ₹${DELIVERY_FEE}
═══════════════════════════════════
Total Amount:   ₹${formatIndianPrice(total)}

🏠 DELIVERY ADDRESS
────────────────
${currentUser.name}
123 Food Street, Foodieville
Mumbai, Maharashtra - 400001
📱 Contact: +91 9876543210

🚚 TRACKING STATUS
────────────────
Order Confirmed ✓
Being Prepared ⋯
Out for Delivery ⋯
Delivered ⋯

Thank you for choosing Sonali's FoodieHub! 🙏
Your happiness is our priority! ❤️`;

    alert(message);
    cart = [];
    updateCartUI();
    toggleCart();
    showNotification('Order confirmed! Get ready for a delicious meal 😋');
}

// Meal Functions
async function fetchMeals(cuisine, retries = 0) {
    const loadingSpinner = document.getElementById('loading');
    const menuContainer = document.getElementById('menu-container');
    
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (menuContainer) menuContainer.style.display = 'none';
        
        const response = await fetch(`${BASE_API_URL}${cuisine}`);
        if (!response.ok) {
            if (response.status === 429 && retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return fetchMeals(cuisine, retries + 1);
            }
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Map the meals data
        allMeals = (data.meals || []).map(meal => ({
            ...meal,
            rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3 and 5
            price: generateRandomPrice()
        }));
        
        return allMeals;
    } catch (error) {
        console.error('Error fetching meals:', error);
        if (SAMPLE_MEALS[cuisine]) {
            allMeals = SAMPLE_MEALS[cuisine].map(meal => ({
                ...meal,
                rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3 and 5
                price: generateRandomPrice()
            }));
        } else {
            showNotification('Error loading meals. Please try again.');
        }
        return allMeals;
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (menuContainer) menuContainer.style.display = 'grid';
    }
}

async function displayMeals(cuisine) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    
    const meals = await fetchMeals(cuisine);
    
    if (meals && meals.length > 0) {
        const menuHTML = meals.map(meal => createMenuItemHTML(meal)).join('');
        menuContainer.innerHTML = menuHTML;
        // Apply current filters after displaying meals
        filterMenuItems();
    } else {
        menuContainer.innerHTML = `
            <div class="no-meals">
                <i class="fas fa-utensils"></i>
                <p>No meals found for ${cuisine} cuisine</p>
                <p>Please try another cuisine or check back later</p>
            </div>
        `;
    }
}

function createMenuItemHTML(meal) {
    const stars = '★'.repeat(Math.floor(meal.rating)) + '☆'.repeat(5 - Math.floor(meal.rating));
    return `
        <div class="menu-item" data-id="${meal.idMeal}">
            <div class="menu-item-image">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <div class="menu-item-badge">${meal.strArea || currentCuisine} Cuisine</div>
            </div>
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-title">${meal.strMeal}</h3>
                    <div class="menu-item-price">₹${formatIndianPrice(meal.price)}</div>
                </div>
                <div class="menu-item-desc">Fresh and delicious ${meal.strArea || currentCuisine} dish</div>
                <div class="menu-item-footer">
                    <div class="menu-item-rating">
                        <span class="stars">${stars}</span>
                        <span>${meal.rating}</span>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart('${meal.idMeal}', '${meal.strMeal}', ${meal.price}, '${meal.strMealThumb}', ${meal.rating})">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

function generateRandomPrice() {
    const min = 100;
    const max = 800;
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Utility Functions
function formatIndianPrice(price) {
    return price.toLocaleString('en-IN');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }, 100);
}

// Search and Filter Functionality

// Update price value display
priceRange.addEventListener('input', () => {
    priceValue.textContent = `₹${priceRange.value}`;
    filterMenuItems();
});

// Handle search input
searchInput.addEventListener('input', debounce(filterMenuItems, 300));

// Handle sort filter change
sortFilter.addEventListener('change', filterMenuItems);

// Debounce function to limit how often filterMenuItems runs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function filterMenuItems() {
    const searchTerm = searchInput.value.toLowerCase();
    const maxPrice = parseInt(priceRange.value);
    const sortValue = sortFilter.value;
    
    const menuItems = Array.from(menuContainer.getElementsByClassName('menu-item'));
    
    // Filter items based on search term and price
    const filteredItems = menuItems.filter(item => {
        const title = item.querySelector('.menu-item-title').textContent.toLowerCase();
        const price = parseInt(item.querySelector('.menu-item-price').textContent.replace(/[^0-9]/g, ''));
        
        const matchesSearch = title.includes(searchTerm);
        const matchesPrice = price <= maxPrice;
        
        return matchesSearch && matchesPrice;
    });
    
    // Sort filtered items
    filteredItems.sort((a, b) => {
        const priceA = parseInt(a.querySelector('.menu-item-price').textContent.replace(/[^0-9]/g, ''));
        const priceB = parseInt(b.querySelector('.menu-item-price').textContent.replace(/[^0-9]/g, ''));
        const ratingA = parseFloat(a.querySelector('.menu-item-rating span:last-child').textContent);
        const ratingB = parseFloat(b.querySelector('.menu-item-rating span:last-child').textContent);
        
        switch(sortValue) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            case 'rating':
                return ratingB - ratingA;
            default: // 'recommended'
                return 0;
        }
    });
    
    // Update visibility of menu items
    menuItems.forEach(item => {
        item.style.display = 'none';
    });
    
    filteredItems.forEach(item => {
        item.style.display = '';
    });
    
    // Show "no results" message if needed
    const noResults = menuContainer.querySelector('.no-results') || createNoResultsElement();
    if (filteredItems.length === 0) {
        noResults.style.display = 'block';
        menuContainer.appendChild(noResults);
    } else {
        noResults.style.display = 'none';
    }
}

function createNoResultsElement() {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.style.cssText = `
        text-align: center;
        padding: 40px;
        width: 100%;
        grid-column: 1 / -1;
        color: #666;
        font-size: 1.1em;
    `;
    noResults.innerHTML = `
        <i class="fas fa-search" style="font-size: 2em; margin-bottom: 15px; color: #999;"></i>
        <p>No menu items found matching your criteria.</p>
    `;
    return noResults;
}

// Featured section functionality
function initializeFeaturedSection() {
    const featuredItems = [
        {
            name: 'Butter Chicken',
            image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Indian',
            rating: 4.8,
            price: 399
        },
        {
            name: 'Sushi Platter',
            image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Japanese',
            rating: 4.9,
            price: 599
        },
        {
            name: 'Margherita Pizza',
            image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Italian',
            rating: 4.7,
            price: 299
        },
        {
            name: 'Pad Thai',
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Thai',
            rating: 4.6,
            price: 349
        },
        {
            name: 'Dim Sum',
            image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Chinese',
            rating: 4.8,
            price: 449
        },
        {
            name: 'Tacos',
            image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&h=500',
            cuisine: 'Mexican',
            rating: 4.7,
            price: 299
        }
    ];

    const featuredWrapper = document.getElementById('featured-wrapper');
    featuredWrapper.innerHTML = featuredItems.map(item => `
        <div class="featured-item">
            <div class="featured-item-image">
                <img src="${item.image}" alt="${item.name}">
                <span class="special-tag">${item.cuisine}</span>
            </div>
            <div class="featured-item-content">
                <h3>${item.name}</h3>
                <div class="meal-rating">
                    <div class="stars">
                        ${'★'.repeat(Math.floor(item.rating))}${item.rating % 1 >= 0.5 ? '½' : ''}
                    </div>
                    <span class="rating-number">${item.rating}</span>
                </div>
                <div class="featured-item-footer">
                    <span class="featured-item-price">₹${item.price}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.name.toLowerCase().replace(/\s+/g, '-')}', '${item.name}', ${item.price}, '${item.image}', ${item.rating})">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Initialize dots
    const dotsContainer = document.getElementById('featured-dots');
    dotsContainer.innerHTML = Array.from({ length: featuredItems.length }).map((_, index) => `
        <button class="featured-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
    `).join('');

    // Initialize navigation
    let currentIndex = 0;
    const dots = document.querySelectorAll('.featured-dot');
    const prevBtn = document.querySelector('.featured-nav.prev');
    const nextBtn = document.querySelector('.featured-nav.next');
    let autoSlideInterval;
    const SLIDE_INTERVAL = 3000; // 3 seconds

    function getVisibleSlides() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function getMaxSlides() {
        return featuredItems.length - getVisibleSlides() + 1;
    }

    function updateSlide(index) {
        currentIndex = Math.max(0, Math.min(index, getMaxSlides() - 1));
        const translateValue = (currentIndex * 100) / getVisibleSlides();
        featuredWrapper.style.transition = 'transform 0.5s ease-in-out';
        featuredWrapper.style.transform = `translateX(-${translateValue}%)`;
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function nextSlide() {
        const nextIndex = currentIndex + 1;
        if (nextIndex < getMaxSlides()) {
            updateSlide(nextIndex);
        } else {
            // Loop back to first slide
            updateSlide(0);
        }
    }

    function prevSlide() {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            updateSlide(prevIndex);
        } else {
            // Loop to last slide
            updateSlide(getMaxSlides() - 1);
        }
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateSlide(index);
            stopAutoSlide();
            startAutoSlide();
        });
    });

    // Pause auto-slide on hover
    featuredWrapper.addEventListener('mouseenter', stopAutoSlide);
    featuredWrapper.addEventListener('mouseleave', startAutoSlide);

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Adjust current index if needed after resize
            const maxSlides = getMaxSlides();
            if (currentIndex >= maxSlides) {
                currentIndex = maxSlides - 1;
            }
            updateSlide(currentIndex);
        }, 250);
    });

    // Initialize slider
    updateSlide(0);
    startAutoSlide();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart from localStorage
    const savedCart = localStorage.getItem('foodieHubCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    
    // Initialize auth state
    updateAuthUI();
    
    // Add click event listeners to cuisine buttons
    const cuisineButtons = document.querySelectorAll('.cuisine-btn');
    cuisineButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            cuisineButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Reset search and filters
            searchInput.value = '';
            priceRange.value = 2000;
            priceValue.textContent = `₹${priceRange.value}`;
            sortFilter.value = 'recommended';
            // Update current cuisine and display meals
            currentCuisine = button.dataset.cuisine;
            displayMeals(currentCuisine);
        });
    });
    
    // Display initial meals
    displayMeals('Indian');
    
    // Initialize featured section
    initializeFeaturedSection();

    // Setup section observer
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
        rootMargin: '-80px 0px 0px 0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const navLink = document.querySelector(`.nav-items a[href="#${id}"]`);
                if (navLink) {
                    document.querySelectorAll('.nav-items a').forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Setup smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add menu navigation functionality
    const orderNowBtn = document.querySelector('.primary-btn');
    const viewMenuBtn = document.querySelector('.secondary-btn');
    const menuNavBtn = document.querySelector('a[href="#menu"]');

    [orderNowBtn, viewMenuBtn, menuNavBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const menuSection = document.getElementById('menu');
                if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });

    // Mobile Menu Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');

    navToggle.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target) && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Close mobile menu when clicking a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
});
