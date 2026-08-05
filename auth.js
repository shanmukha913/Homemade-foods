const STORAGE_KEYS = {
    users: "homemade_users",
    session: "homemade_session",
    cart: "homemade_cart",
    ratings: "homemade_ratings",
    userRatings: "homemade_user_ratings"
};

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

function isValidPhone(value) {
    return /^\d{10}$/.test(value.replace(/\s/g, ""));
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function detectContactType(value) {
    const trimmed = value.trim();
    if (trimmed.includes("@")) return "email";
    if (/^\d/.test(trimmed)) return "phone";
    return null;
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({
        name: user.name,
        contact: user.contact,
        contactType: user.contactType
    }));
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}

function setFieldStatus(el, isValid, validMsg, invalidMsg) {
    if (!el) return;
    const value = el.previousElementSibling?.value?.trim() || el.parentElement.querySelector("input")?.value?.trim();
    if (!value) {
        el.hidden = true;
        el.className = "field-status";
        return;
    }
    el.hidden = false;
    el.className = "field-status " + (isValid ? "valid" : "invalid");
    el.textContent = isValid ? validMsg : invalidMsg;
}

function validateContactInput(value, expectedType) {
    const type = expectedType || detectContactType(value);
    if (type === "phone") {
        return { valid: isValidPhone(value), type: "phone" };
    }
    if (type === "email") {
        return { valid: isValidEmail(value), type: "email" };
    }
    return { valid: false, type: null };
}

function showContactStatus(inputEl, statusEl, expectedType) {
    const value = inputEl.value.trim();
    if (!value) {
        statusEl.hidden = true;
        return null;
    }
    const result = validateContactInput(value, expectedType);
    if (result.type === "phone") {
        setFieldStatus(statusEl, result.valid,
            "✓ Valid phone number",
            "✗ Invalid — enter 10 digits");
    } else if (result.type === "email") {
        setFieldStatus(statusEl, result.valid,
            "✓ Valid Gmail / email",
            "✗ Invalid email format");
    } else {
        statusEl.hidden = false;
        statusEl.className = "field-status invalid";
        statusEl.textContent = "✗ Enter a valid phone or Gmail";
    }
    return result;
}

let signupContactType = "phone";

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginContact = document.getElementById("loginContact");
const loginContactStatus = document.getElementById("loginContactStatus");
const signupContact = document.getElementById("signupContact");
const signupContactStatus = document.getElementById("signupContactStatus");
const signupContactLabel = document.getElementById("signupContactLabel");
const signupConfirm = document.getElementById("signupConfirm");
const confirmStatus = document.getElementById("confirmStatus");

document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const isLogin = tab.dataset.tab === "login";
        loginForm.hidden = !isLogin;
        signupForm.hidden = isLogin;
    });
});

document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        signupContactType = btn.dataset.type;
        if (signupContactType === "phone") {
            signupContactLabel.textContent = "Phone Number";
            signupContact.placeholder = "Enter 10-digit phone number";
        } else {
            signupContactLabel.textContent = "Gmail / Email";
            signupContact.placeholder = "Enter your Gmail address";
        }
        signupContact.value = "";
        signupContactStatus.hidden = true;
    });
});

loginContact.addEventListener("input", () => {
    showContactStatus(loginContact, loginContactStatus);
});

signupContact.addEventListener("input", () => {
    showContactStatus(signupContact, signupContactStatus, signupContactType);
});

signupConfirm.addEventListener("input", () => {
    const pass = document.getElementById("signupPassword").value;
    const confirm = signupConfirm.value;
    if (!confirm) {
        confirmStatus.hidden = true;
        return;
    }
    const match = pass === confirm && pass.length >= 6;
    setFieldStatus(confirmStatus, match,
        "✓ Passwords match",
        pass.length < 6 ? "✗ Password must be at least 6 characters" : "✗ Passwords do not match");
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("loginError");
    const contact = loginContact.value.trim();
    const password = document.getElementById("loginPassword").value;
    const contactCheck = validateContactInput(contact);

    if (!contactCheck.valid) {
        errorBox.textContent = "Enter a valid phone number or Gmail.";
        errorBox.hidden = false;
        return;
    }

    const users = getUsers();
    const user = users.find((u) => u.contact === contact && u.password === password);

    if (!user) {
        errorBox.textContent = "Invalid credentials. Please try again or sign up.";
        errorBox.hidden = false;
        return;
    }

    setSession(user);
    showToast("Welcome back, " + user.name + "!");
    setTimeout(() => { window.location.href = "index.html"; }, 800);
});

signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("signupError");
    const name = document.getElementById("signupName").value.trim();
    const contact = signupContact.value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = signupConfirm.value;
    const contactCheck = validateContactInput(contact, signupContactType);

    if (!name) {
        errorBox.textContent = "Please enter your name.";
        errorBox.hidden = false;
        return;
    }

    if (!contactCheck.valid) {
        errorBox.textContent = signupContactType === "phone"
            ? "Enter a valid 10-digit phone number."
            : "Enter a valid Gmail / email address.";
        errorBox.hidden = false;
        return;
    }

    if (password.length < 6) {
        errorBox.textContent = "Password must be at least 6 characters.";
        errorBox.hidden = false;
        return;
    }

    if (password !== confirm) {
        errorBox.textContent = "Passwords do not match.";
        errorBox.hidden = false;
        return;
    }

    const users = getUsers();
    if (users.some((u) => u.contact === contact)) {
        errorBox.textContent = "An account with this phone/email already exists. Please login.";
        errorBox.hidden = false;
        return;
    }

    const newUser = {
        name,
        contact,
        contactType: contactCheck.type,
        password
    };

    users.push(newUser);
    saveUsers(users);
    setSession(newUser);
    showToast("Account created! Redirecting...");
    setTimeout(() => { window.location.href = "index.html"; }, 800);
});

if (getSession()) {
    window.location.href = "index.html";
}

const urlTab = new URLSearchParams(window.location.search).get("tab");
if (urlTab === "signup") {
    document.querySelector('.auth-tab[data-tab="signup"]').click();
}
