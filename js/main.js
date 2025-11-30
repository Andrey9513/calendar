// Main application logic
let userPassword = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated (session cookie exists)
    checkAuthentication();
});

async function checkAuthentication() {
    try {
        // Try to fetch events - if successful, we're authenticated
        const response = await fetch('/api/events');
        if (response.ok) {
            // Already authenticated, show calendar
            showPasswordPrompt();
        } else {
            // Not authenticated, show login
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('calendar-container').classList.add('hidden');

    // Handle login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        try {
            // await CalendarAPI.login(password);
            // userPassword = password;
            // await loadCalendar();
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('calendar-container').classList.remove('hidden');
        } catch (error) {
            errorEl.textContent = 'Invalid password';
        }
    });
}

function showPasswordPrompt() {
    // User is authenticated but we need password for decryption
    const password = prompt('Enter your encryption password to decrypt events:');
    if (!password) {
        window.location.href = '/auth/logout';
        return;
    }
    
    userPassword = password;
    loadCalendar();
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('calendar-container').classList.remove('hidden');
}

async function loadCalendar() {
    try {
        // Fetch encrypted events
        const encryptedData = await CalendarAPI.getEvents();
        
        let events = [];
        if (encryptedData && encryptedData.ciphertext) {
            // Decrypt events
            const decryptedJson = await CalendarAPI.decrypt(encryptedData, userPassword);
            events = JSON.parse(decryptedJson);
        }

        // Initialize calendar UI
        CalendarUI.init(events);

        // Setup event form
        setupEventForm();

        // Setup logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await CalendarAPI.logout();
        });

        // Listen for event changes
        window.addEventListener('events-changed', async (e) => {
            await saveEvents(e.detail);
        });

    } catch (error) {
        console.error('Failed to load calendar:', error);
        alert('Failed to decrypt calendar. Please check your password.');
        window.location.reload();
    }
}

function setupEventForm() {
    const form = document.getElementById('event-form');
    
    // Set default date to today
    document.getElementById('event-date').valueAsDate = new Date();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const event = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            description: document.getElementById('event-description').value
        };

        CalendarUI.addEvent(event);
        form.reset();
        document.getElementById('event-date').valueAsDate = new Date();
    });
}

async function saveEvents(events) {
    try {
        // Encrypt events
        const plaintext = JSON.stringify(events);
        const encrypted = await CalendarAPI.encrypt(plaintext, userPassword);

        // Save to API
        await CalendarAPI.saveEvents(encrypted);
    } catch (error) {
        console.error('Failed to save events:', error);
        alert('Failed to save events. Please try again.');
    }
}