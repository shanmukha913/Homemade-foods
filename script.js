const DELIVERY_CHARGE = 20;

const STORAGE_KEYS = {
    users: "homemade_users",
    session: "homemade_session",
    cart: "homemade_cart",
    ratings: "homemade_ratings",
    userRatings: "homemade_user_ratings",
    orders: "homemade_orders"
};

let selectedFood = "";
let selectedPrice = 0;

const modal = document.getElementById("orderModal");
const cartModal = document.getElementById("cartModal");
const searchInput = document.getElementById("search");
const clearSearchBtn = document.getElementById("clearSearch");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const toast = document.getElementById("toast");

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => { toast.hidden = true; }, 300);
    }, 2800);
}

function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}

function getOrderKey() {
    const session = getSession();
    return session ? `${STORAGE_KEYS.orders}_${session.contact}` : `${STORAGE_KEYS.orders}_guest`;
}

function getOrders() {
    return JSON.parse(localStorage.getItem(getOrderKey()) || "[]");
}

function saveOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    localStorage.setItem(getOrderKey(), JSON.stringify(orders));
    renderOrderHistory();
}

function getCart() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || "[]");
}

function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
    updateCartBadge();
}

function getRatings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ratings) || "{}");
}

function saveRatings(ratings) {
    localStorage.setItem(STORAGE_KEYS.ratings, JSON.stringify(ratings));
}

function getUserRatingsKey() {
    const session = getSession();
    return session
        ? `${STORAGE_KEYS.userRatings}_${session.contact}`
        : `${STORAGE_KEYS.userRatings}_guest`;
}

function getUserRatings() {
    return JSON.parse(localStorage.getItem(getUserRatingsKey()) || "{}");
}

function saveUserRatings(userRatings) {
    localStorage.setItem(getUserRatingsKey(), JSON.stringify(userRatings));
}

function updateAuthNav() {
    const authNav = document.getElementById("authNav");
    const session = getSession();

    if (session) {
        authNav.innerHTML = `
            <span class="user-greeting">Hi, ${session.name.split(" ")[0]}</span>
            <button type="button" class="nav-btn logout-btn" id="logoutBtn">Logout</button>
        `;
        document.getElementById("logoutBtn").addEventListener("click", () => {
            clearSession();
            showToast("Logged out successfully.");
            updateAuthNav();
            prefillOrderForm();
        });
    } else {
        authNav.innerHTML = `
            <a href="auth.html?tab=login" class="nav-btn auth-link">Login</a>
            <a href="auth.html?tab=signup" class="nav-btn auth-link auth-signup">Sign Up</a>
        `;
    }
}

function prefillOrderForm() {
    const session = getSession();
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");

    if (session) {
        nameInput.value = session.name;
        phoneInput.value = session.contactType === "phone" ? session.contact : "";
    } else {
        nameInput.value = "";
        phoneInput.value = "";
    }
}

function renderOrderHistory() {
    const history = document.getElementById("history");
    if (!history) return;
    const orders = getOrders();
    if (orders.length === 0) {
        history.innerHTML = `<p class="empty-history">No orders yet. Place your first order!</p>`;
        return;
    }

    history.innerHTML = orders.map((order) => {
        const date = new Date(order.date).toLocaleString();
        const items = order.items
            ? order.items.map((i) => `${i.food} x${i.qty}`).join(", ")
            : order.food;
        return `<p class="history-item"><span class="history-date">${date}</span> ✅ ${items} — ${order.name} (₹${order.total})</p>`;
    }).join("");
}

function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").textContent = count;
}

function addToCart(id, food, price) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, food, price, qty: 1 });
    }

    saveCart(cart);
    showToast(`${food} added to cart!`);
}

function renderCartModal() {
    const cart = getCart();
    const container = document.getElementById("cartItems");

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart">Your cart is empty. Add some delicious food!</p>`;
        document.getElementById("cartSubtotal").textContent = "₹0";
        document.getElementById("cartTotal").textContent = `₹${DELIVERY_CHARGE}`;
        return;
    }

    container.innerHTML = cart.map((item) => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <strong>${item.food}</strong>
                <span>₹${item.price} each</span>
            </div>
            <div class="cart-item-controls">
                <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
                <button type="button" class="remove-btn" data-id="${item.id}">Remove</button>
            </div>
            <span class="cart-item-total">₹${item.price * item.qty}</span>
        </div>
    `).join("");

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.getElementById("cartSubtotal").textContent = `₹${subtotal}`;
    document.getElementById("cartTotal").textContent = `₹${subtotal + DELIVERY_CHARGE}`;

    container.querySelectorAll(".qty-btn, .remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            let cartData = getCart();
            const item = cartData.find((i) => i.id === id);
            if (!item) return;

            if (btn.classList.contains("remove-btn")) {
                cartData = cartData.filter((i) => i.id !== id);
            } else if (btn.dataset.action === "increase") {
                item.qty += 1;
            } else if (item.qty > 1) {
                item.qty -= 1;
            } else {
                cartData = cartData.filter((i) => i.id !== id);
            }

            saveCart(cartData);
            renderCartModal();
        });
    });
}

function openCartModal() {
    renderCartModal();
    cartModal.hidden = false;
    document.body.classList.add("modal-open");
}

function closeCartModal() {
    cartModal.hidden = true;
    document.body.classList.remove("modal-open");
}

function checkoutCart() {
    const cart = getCart();
    const errorBox = document.getElementById("cartError");
    const address = document.getElementById("cartAddress").value.trim();
    const session = getSession();

    if (cart.length === 0) {
        errorBox.textContent = "Your cart is empty.";
        errorBox.hidden = false;
        return;
    }

    if (!session) {
        errorBox.textContent = "Please login to checkout.";
        errorBox.hidden = false;
        showToast("Login required to checkout.");
        return;
    }

    if (!address) {
        errorBox.textContent = "Please enter a delivery address.";
        errorBox.hidden = false;
        return;
    }

    errorBox.hidden = true;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subtotal + DELIVERY_CHARGE;
    const deliveryTime = Math.floor(Math.random() * 15) + 20;

    saveOrder({
        name: session.name,
        items: cart.map((i) => ({ food: i.food, qty: i.qty, price: i.price })),
        total,
        address,
        date: Date.now()
    });

    localStorage.setItem(STORAGE_KEYS.cart, "[]");
    updateCartBadge();

    document.querySelector("#cartModal .modal-content").innerHTML = `
        <div class="success">
            <div class="tick" aria-hidden="true">✓</div>
            <h2>Order Confirmed</h2>
            <p>Thank you, ${session.name}!</p>
            <p>${cart.length} item(s) ordered successfully.</p>
            <p>Total paid: <strong>₹${total}</strong></p>
            <p>Estimated delivery: ${deliveryTime}–${deliveryTime + 5} minutes</p>
            <button type="button" class="btn-primary" style="margin-top:18px;width:100%" id="closeCartSuccess">Close</button>
        </div>
    `;

    document.getElementById("closeCartSuccess").addEventListener("click", () => {
        location.reload();
    });

    showToast("Cart order placed successfully!");
}

function renderRatingRow(container, foodId) {
    const ratings = getRatings();
    const userRatings = getUserRatings();
    const data = ratings[foodId] || { total: 0, count: 0 };
    const avg = data.count ? (data.total / data.count).toFixed(1) : "0.0";
    const userRating = userRatings[foodId] || 0;

    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
        const filled = i <= Math.round(data.count ? data.total / data.count : 0);
        const userFilled = i <= userRating;
        starsHtml += `<button type="button" class="star-btn ${filled ? "filled" : ""} ${userFilled ? "user-rated" : ""}" data-id="${foodId}" data-value="${i}" aria-label="Rate ${i} stars">★</button>`;
    }

    container.innerHTML = `
        <div class="stars">${starsHtml}</div>
        <span class="rating-text">${avg} (${data.count} ratings)</span>
    `;

    container.querySelectorAll(".star-btn").forEach((star) => {
        star.addEventListener("click", (e) => {
            e.stopPropagation();
            rateFood(foodId, Number(star.dataset.value));
        });
    });
}

function rateFood(foodId, value) {
    const ratings = getRatings();
    const userRatings = getUserRatings();
    const prev = userRatings[foodId];

    if (!ratings[foodId]) {
        ratings[foodId] = { total: 0, count: 0 };
    }

    if (prev) {
        ratings[foodId].total = ratings[foodId].total - prev + value;
    } else {
        ratings[foodId].total += value;
        ratings[foodId].count += 1;
    }

    userRatings[foodId] = value;
    saveRatings(ratings);
    saveUserRatings(userRatings);

    document.querySelectorAll(`.rating-row[data-id="${foodId}"]`).forEach((row) => {
        renderRatingRow(row, foodId);
    });

    showToast(`You rated ${value} star${value > 1 ? "s" : ""}!`);
}

function initRatings() {
    document.querySelectorAll(".rating-row").forEach((row) => {
        renderRatingRow(row, row.dataset.id);
    });
}

function searchFood() {
    const input = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".card");
    let visibleCount = 0;

    clearSearchBtn.hidden = input.length === 0;

    cards.forEach((card) => {
        const foodName = card.querySelector(".food-name").innerText.toLowerCase();
        const visible = foodName.includes(input);
        card.style.display = visible ? "" : "none";
        if (visible) visibleCount++;
    });

    document.querySelectorAll(".section .food-grid").forEach((grid) => {
        const existing = grid.querySelector(".no-results");
        if (existing) existing.remove();
        const sectionCards = [...grid.querySelectorAll(".card")];
        const hasVisible = sectionCards.some((card) => card.style.display !== "none");
        if (!hasVisible && input) {
            const msg = document.createElement("p");
            msg.className = "no-results";
            msg.textContent = "No items match your search in this category.";
            grid.appendChild(msg);
        }
    });

    if (input && visibleCount === 0) {
        showToast("No food items found. Try a different search.");
    }
}

function updateBill() {
    const quantity = Number(document.getElementById("quantity").value);
    const subtotal = selectedPrice * quantity;
    document.getElementById("itemPrice").textContent = `₹${subtotal}`;
    document.getElementById("totalPrice").textContent = `₹${subtotal + DELIVERY_CHARGE}`;
}

function openOrderModal(food, price) {
    selectedFood = food;
    selectedPrice = price;

    document.getElementById("foodName").textContent = food;
    document.getElementById("customerAddress").value = "";
    document.getElementById("quantity").value = "1";
    document.getElementById("formError").hidden = true;

    document.querySelectorAll("#orderModal .field input, #orderModal .field textarea").forEach((el) => {
        el.classList.remove("invalid");
    });

    prefillOrderForm();
    updateBill();
    modal.hidden = false;
    document.body.classList.add("modal-open");
}

function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
}

function confirmOrder() {
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const addressInput = document.getElementById("customerAddress");
    const errorBox = document.getElementById("formError");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    nameInput.classList.toggle("invalid", !name);
    phoneInput.classList.toggle("invalid", !phone);
    addressInput.classList.toggle("invalid", !address);

    if (!name || !phone || !address) {
        errorBox.textContent = "Please fill in all fields before confirming.";
        errorBox.hidden = false;
        showToast("Please complete all order details.");
        return;
    }

    if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
        phoneInput.classList.add("invalid");
        errorBox.textContent = "Enter a valid 10-digit phone number.";
        errorBox.hidden = false;
        return;
    }

    const quantity = Number(document.getElementById("quantity").value);
    const total = selectedPrice * quantity + DELIVERY_CHARGE;
    const deliveryTime = Math.floor(Math.random() * 15) + 20;

    saveOrder({
        name,
        food: selectedFood,
        qty: quantity,
        total,
        address,
        date: Date.now()
    });

    document.querySelector("#orderModal .modal-content").innerHTML = `
        <div class="success">
            <div class="tick" aria-hidden="true">✓</div>
            <h2>Order Confirmed</h2>
            <p>Thank you, ${name}!</p>
            <p>Your <strong>${selectedFood}</strong> order (${quantity} pack${quantity > 1 ? "s" : ""}) has been placed.</p>
            <p>Total paid: <strong>₹${total}</strong></p>
            <p>Estimated delivery: ${deliveryTime}–${deliveryTime + 5} minutes</p>
            <button type="button" class="btn-primary" style="margin-top:18px;width:100%" id="closeSuccessBtn">Close</button>
        </div>
    `;

    document.getElementById("closeSuccessBtn").addEventListener("click", () => {
        location.reload();
    });

    showToast("Order placed successfully!");
}

function setActiveNavLink() {
    const sections = document.querySelectorAll("section[id]");
    const links = document.querySelectorAll(".nav-links a");
    let current = "";

    sections.forEach((section) => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute("id");
        }
    });

    links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
}

document.querySelectorAll(".card").forEach((card) => {
    const id = card.dataset.id;
    const food = card.dataset.food;
    const price = Number(card.dataset.price);

    card.querySelector(".cart-add-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(id, food, price);
    });

    card.querySelector(".order-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openOrderModal(food, price);
    });
});

searchInput.addEventListener("input", searchFood);

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchFood();
    searchInput.focus();
});

document.getElementById("quantity").addEventListener("change", updateBill);
document.getElementById("confirmOrderBtn").addEventListener("click", confirmOrder);
document.getElementById("openCartBtn").addEventListener("click", openCartModal);
document.getElementById("checkoutCartBtn").addEventListener("click", checkoutCart);

document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
        const target = el.dataset.closeModal;
        if (target === "cartModal") closeCartModal();
        else closeModal();
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (!cartModal.hidden) closeCartModal();
        else if (!modal.hidden) closeModal();
    }
});

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

window.addEventListener("scroll", setActiveNavLink, { passive: true });

updateAuthNav();
updateCartBadge();
renderOrderHistory();
initRatings();
setActiveNavLink();
