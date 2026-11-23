const demoRestaurants = [
    {
        "id": 1,
        "name": "Пиццерия у дома",
        "address": "Москва, Пушкина, 10",
        "open": true
    },
    {
        "id": 2,
        "name": "Суши рядом",
        "address": "Москва, Садовая, 5",
        "open": true
    }
];

const demoMenus = {
    "1": [
        {
            "id": 1,
            "name": "Маргарита",
            "price": 550.0,
            "available": true
        },
        {
            "id": 2,
            "name": "Лимонад",
            "price": 150.0,
            "available": true
        }
    ],
    "2": [
        {
            "id": 3,
            "name": "Филадельфия",
            "price": 650.0,
            "available": true
        },
        {
            "id": 4,
            "name": "Чай",
            "price": 120.0,
            "available": true
        }
    ]
};

const state = {
    restaurants: [],
    selectedRestaurant: null,
    menu: [],
    cart: new Map()
};

const elements = {
    restaurantList: document.querySelector("#restaurant-list"),
    refreshButton: document.querySelector("#refresh-button"),
    menuTitle: document.querySelector("#menu-title"),
    menuSubtitle: document.querySelector("#menu-subtitle"),
    menuGrid: document.querySelector("#menu-grid"),
    cartItems: document.querySelector("#cart-items"),
    cartCount: document.querySelector("#cart-count"),
    cartTotal: document.querySelector("#cart-total"),
    clearCart: document.querySelector("#clear-cart"),
    toast: document.querySelector("#toast")
};

const money = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

let toastTimer;

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${type}`;
    toastTimer = setTimeout(() => {
        elements.toast.className = "toast";
    }, 3600);
}

function loadRestaurants() {
    state.restaurants = demoRestaurants;
    renderRestaurants();
    const firstOpen = state.restaurants.find(restaurant => restaurant.open);
    if (firstOpen) {
        selectRestaurant(firstOpen.id);
    }
}

function renderRestaurants() {
    if (!state.restaurants.length) {
        elements.restaurantList.innerHTML = '<div class="empty-state"><strong>Ресторанов пока нет</strong></div>';
        return;
    }

    elements.restaurantList.innerHTML = state.restaurants.map((restaurant, index) => `
        <button class="restaurant-card ${state.selectedRestaurant?.id === restaurant.id ? "active" : ""}"
                type="button" data-restaurant-id="${restaurant.id}" ${restaurant.open ? "" : "disabled"}>
            <span class="restaurant-icon">${index % 2 === 0 ? "🍕" : "🍣"}</span>
            <span>
                <strong>${escapeHtml(restaurant.name)}</strong>
                <p>${escapeHtml(restaurant.address)}</p>
            </span>
            <span class="availability ${restaurant.open ? "" : "closed"}">${restaurant.open ? "Открыт" : "Закрыт"}</span>
        </button>`).join("");

    elements.restaurantList.querySelectorAll("[data-restaurant-id]").forEach(button => {
        button.addEventListener("click", () => selectRestaurant(Number(button.dataset.restaurantId)));
    });
}

function selectRestaurant(id) {
    const restaurant = state.restaurants.find(item => item.id === id);
    if (!restaurant || !restaurant.open) return;

    if (state.selectedRestaurant && state.selectedRestaurant.id !== id && state.cart.size) {
        state.cart.clear();
        renderCart();
        showToast("Корзина очищена: заказ оформляется из одного ресторана");
    }

    state.selectedRestaurant = restaurant;
    renderRestaurants();
    elements.menuTitle.textContent = restaurant.name;
    elements.menuSubtitle.textContent = restaurant.address;
    elements.menuGrid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';

    state.menu = demoMenus[id];
    renderMenu();
}

function renderMenu() {
    if (!state.menu.length) {
        elements.menuGrid.innerHTML = '<div class="empty-state"><strong>В меню пока нет блюд</strong></div>';
        return;
    }

    elements.menuGrid.innerHTML = state.menu.map((item, index) => `
        <article class="menu-card ${item.available ? "" : "unavailable"}">
            <div class="dish-icon">${index % 4 === 0 ? "🍕" : index % 4 === 1 ? "🥤" : index % 4 === 2 ? "🍣" : "🍵"}</div>
            <div class="menu-card-footer">
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span class="price">${money.format(item.price)}</span>
                </div>
                <button class="add-button" type="button" data-menu-item-id="${item.id}"
                        aria-label="Добавить ${escapeHtml(item.name)}" ${item.available ? "" : "disabled"}>+</button>
            </div>
        </article>`).join("");

    elements.menuGrid.querySelectorAll("[data-menu-item-id]").forEach(button => {
        button.addEventListener("click", () => addToCart(Number(button.dataset.menuItemId)));
    });
}

function addToCart(id) {
    const item = state.menu.find(menuItem => menuItem.id === id);
    if (!item || !item.available) return;
    const current = state.cart.get(id);
    const quantity = Math.min((current?.quantity || 0) + 1, 20);
    state.cart.set(id, { ...item, quantity });
    renderCart();
    showToast(`${item.name} добавлен в корзину`);
}

function changeQuantity(id, delta) {
    const current = state.cart.get(id);
    if (!current) return;
    const quantity = current.quantity + delta;
    if (quantity <= 0) {
        state.cart.delete(id);
    } else {
        state.cart.set(id, { ...current, quantity: Math.min(quantity, 20) });
    }
    renderCart();
}

function renderCart() {
    const items = [...state.cart.values()];
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    elements.cartCount.textContent = count;
    elements.cartTotal.textContent = money.format(total);

    if (!items.length) {
        elements.cartItems.innerHTML = '<div class="cart-empty">Добавьте блюда из меню</div>';
        return;
    }

    elements.cartItems.innerHTML = items.map(item => `
        <div class="cart-item">
            <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span class="cart-item-price">${money.format(Number(item.price) * item.quantity)}</span>
            </div>
            <div class="quantity">
                <button type="button" data-quantity-id="${item.id}" data-delta="-1" aria-label="Уменьшить">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-quantity-id="${item.id}" data-delta="1" aria-label="Увеличить">+</button>
            </div>
        </div>`).join("");

    elements.cartItems.querySelectorAll("[data-quantity-id]").forEach(button => {
        button.addEventListener("click", () => changeQuantity(Number(button.dataset.quantityId), Number(button.dataset.delta)));
    });
}

elements.refreshButton.addEventListener("click", loadRestaurants);
elements.clearCart.addEventListener("click", () => {
    state.cart.clear();
    renderCart();
});

loadRestaurants();
