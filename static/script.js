// ===== API НАСТРОЙКИ =====
const API_URL = '/api/';

let currentFilter = 'all';
let currentUser = null;
let products = [];

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    loadProducts();
    initAuthButtons();
    initFilters();
    initContactForm();
});

function initAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const modal = document.getElementById('authModal');
    
    if (loginBtn) {
        loginBtn.onclick = function() {
            console.log('Клик по входу');
            if (modal) modal.style.display = 'flex';
            switchTab('login');
        };
    }
    
    if (registerBtn) {
        registerBtn.onclick = function() {
            console.log('Клик по регистрации');
            if (modal) modal.style.display = 'flex';
            switchTab('register');
        };
    }
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            loadProducts();
        });
    });
}

function initContactForm() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.onclick = function() {
            const name = document.getElementById('userName').value.trim();
            const contact = document.getElementById('userContact').value.trim();
            const msg = document.getElementById('formMessage');
            
            if (!name || !contact) {
                msg.style.color = "#c44536";
                msg.textContent = "Заполните оба поля 😊";
                return;
            }
            msg.style.color = "#8b3a3a";
            msg.textContent = `Спасибо, ${name}! Скоро свяжусь с вами в ${contact}`;
            document.getElementById('userName').value = '';
            document.getElementById('userContact').value = '';
            setTimeout(() => { msg.textContent = ''; }, 5000);
        };
    }
}

async function loadProducts() {
    try {
        let url = `${API_URL}products/`;
        if (currentFilter !== 'all') {
            url += `?category=${currentFilter}`;
        }
        const response = await fetch(url);
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

function getCategoryName(slug) {
    const map = {
        'landing': 'ЛЕНДИНГ',
        'shop': 'ИНТЕРНЕТ-МАГАЗИН',
        'dashboard': 'CRM / ДАШБОРД'
    };
    return map[slug] || 'ГОТОВЫЙ САЙТ';
}

// для иконок короче 
function getIconForProduct(slug) {
    const icons = {
        'landing': '<i class="fas fa-globe"></i>',
        'shop': '<i class="fas fa-store"></i>',
        'dashboard': '<i class="fas fa-chart-pie"></i>'
    };
    return icons[slug] || '<i class="fas fa-box"></i>';
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px;">Товаров пока нет 🙃 Добавьте их в админке</div>`;
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="card-img">${getIconForProduct(product.category_slug)}</div>
            <div class="card-content">
                <div class="card-category">${getCategoryName(product.category_slug)}</div>
                <div class="card-title">${product.name}</div>
                <div class="card-desc">${product.description}</div>
                <div class="price-row">
                    <span class="price">${Number(product.price).toLocaleString()} ₽</span>
                    <button class="buy-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Купить</button>
                </div>
            </div>
        </div>
    `).join('');

    attachBuyButtons();
}

function attachBuyButtons() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const productId = this.getAttribute('data-id');
            const productName = this.getAttribute('data-name');
            const productPrice = this.getAttribute('data-price');
            
            if (currentUser) {
                openPaymentModal(productId, productName, productPrice);
            } else {
                alert(`🔐 Для покупки "${productName}" нужно войти в аккаунт`);
                openAuthModal();
                localStorage.setItem('intendedPurchase', JSON.stringify({ id: productId, name: productName, price: productPrice }));
            }
        };
    });
}

const authModal = document.getElementById('authModal');
const paymentModal = document.getElementById('paymentModal');

function openAuthModal() { 
    if (authModal) authModal.style.display = 'flex'; 
}
function closeAuthModal() { 
    if (authModal) authModal.style.display = 'none'; 
}

if (authModal) {
    const closeBtn = authModal.querySelector('.close-modal');
    if (closeBtn) closeBtn.onclick = closeAuthModal;
    window.onclick = function(e) { 
        if (e.target === authModal) closeAuthModal(); 
    };
}

if (paymentModal) {
    const closePayment = paymentModal.querySelector('.close-payment');
    if (closePayment) closePayment.onclick = function() { 
        paymentModal.style.display = 'none'; 
    };
    window.onclick = function(e) { 
        if (e.target === paymentModal) paymentModal.style.display = 'none'; 
    };
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
        if (tabs[0]) tabs[0].classList.add('active');
        if (tabs[1]) tabs[1].classList.remove('active');
    } else {
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (tabs[0]) tabs[0].classList.remove('active');
        if (tabs[1]) tabs[1].classList.add('active');
    }
}

// ===== АВТОРИЗАЦИЯ =====
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}users/login/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
            closeAuthModal();
            alert(`Добро пожаловать, ${data.username}!`);
            
            const intended = localStorage.getItem('intendedPurchase');
            if (intended) {
                const p = JSON.parse(intended);
                alert(`Теперь вы можете приобрести ${p.name}`);
                localStorage.removeItem('intendedPurchase');
            }
            return true;
        } else {
            alert(data.error || 'Ошибка входа');
            return false;
        }
    } catch (error) {
        alert('Ошибка соединения');
        return false;
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}users/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ username, email, password })
        });
        if (response.ok) {
            alert('Регистрация успешна! Теперь войдите');
            switchTab('login');
            return true;
        } else {
            alert('Ошибка регистрации');
            return false;
        }
    } catch (error) {
        alert('Ошибка соединения');
        return false;
    }
}

async function createPurchase(productId, paymentMethod) {
    try {
        const response = await fetch(`${API_URL}purchases/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ product: productId, payment_method: paymentMethod })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function updateAuthUI() {
    const authContainer = document.querySelector('.auth-buttons');
    if (!authContainer) return;
    
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-info"><i class="fas fa-user-circle"></i><span>${currentUser.username}</span></div>
            <button class="btn-logout" id="logoutBtn">Выйти</button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = function() {
                currentUser = null;
                localStorage.removeItem('currentUser');
                updateAuthUI();
                alert('Вы вышли');
            };
        }
    } else {
        authContainer.innerHTML = `
            <button class="btn-login" id="loginBtn">Вход</button>
            <button class="btn-register" id="registerBtn">Регистрация</button>
        `;
        initAuthButtons();
    }
}

const submitLogin = document.getElementById('submitLogin');
if (submitLogin) {
    submitLogin.onclick = function() {
        const username = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        if (username && password) login(username, password);
        else alert('Введите логин и пароль');
    };
}

const submitRegister = document.getElementById('submitRegister');
if (submitRegister) {
    submitRegister.onclick = function() {
        const name = document.getElementById('regName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const confirm = document.getElementById('regConfirmPassword')?.value;
        
        if (!name || !email || !password || !confirm) { alert('Заполните все поля'); return; }
        if (password !== confirm) { alert('Пароли не совпадают'); return; }
        if (password.length < 4) { alert('Пароль минимум 4 символа'); return; }
        
        register(name, email, password);
    };
}

const switchToRegister = document.getElementById('switchToRegister');
if (switchToRegister) switchToRegister.onclick = function(e) { e.preventDefault(); switchTab('register'); };

const switchToLogin = document.getElementById('switchToLogin');
if (switchToLogin) switchToLogin.onclick = function(e) { e.preventDefault(); switchTab('login'); };

let currentProductId = null;

function openPaymentModal(productId, productName, productPrice) {
    currentProductId = productId;
    const nameSpan = document.getElementById('paymentProductName');
    const amountSpan = document.getElementById('paymentAmount');
    if (nameSpan) nameSpan.innerText = productName;
    if (amountSpan) amountSpan.innerText = `${Number(productPrice).toLocaleString()} ₽`;
    if (paymentModal) paymentModal.style.display = 'flex';
}

function validateCardFields() {
    const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry')?.value;
    const cardCvv = document.getElementById('cardCvv')?.value;
    const cardName = document.getElementById('cardName')?.value;
    
    if (!cardNumber || cardNumber.length < 16) {
        alert('Введите номер карты');
        return false;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
        alert('Введите срок действия карты');
        return false;
    }
    if (!cardCvv || cardCvv.length < 3) {
        alert('Введите CVV код');
        return false;
    }
    if (!cardName) {
        alert('Введите имя держателя карты');
        return false;
    }
    return true;
}

async function processPayment() {
    if (!currentProductId) return;
    
    if (!validateCardFields()) return;
    
    const btn = document.getElementById('payNowBtn');
    if (btn) {
        btn.innerText = '⏳ Обработка...';
        btn.disabled = true;
    }
    
    const success = await createPurchase(currentProductId, 'card');
    
    setTimeout(() => {
        if (btn) {
            btn.innerText = 'Оплатить';
            btn.disabled = false;
        }
        if (paymentModal) paymentModal.style.display = 'none';
        if (success) {
            alert(`✅ Оплата прошла успешно!\n\nСпасибо за покупку!`);
            currentProductId = null;
            if (document.getElementById('cardNumber')) document.getElementById('cardNumber').value = '';
            if (document.getElementById('cardExpiry')) document.getElementById('cardExpiry').value = '';
            if (document.getElementById('cardCvv')) document.getElementById('cardCvv').value = '';
            if (document.getElementById('cardName')) document.getElementById('cardName').value = '';
        } else {
            alert('❌ Ошибка оплаты. Попробуйте позже.');
        }
    }, 1500);
}

const payNowBtn = document.getElementById('payNowBtn');
if (payNowBtn) {
    payNowBtn.onclick = function() {
        processPayment();
    };
}

setTimeout(function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const modal = document.getElementById('authModal');
    
    if (loginBtn && modal) {
        loginBtn.onclick = function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
        };
    }
    
    if (registerBtn && modal) {
        registerBtn.onclick = function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
        };
    }
}, 500);