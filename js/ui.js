// Calendar UI rendering
const CalendarUI = {
    currentDate: new Date(),
    events: [],

    init(events) {
        this.events = events || [];
        this.render();
        this.attachEventListeners();
    },

    render() {
        this.renderMonth();
        this.renderEventsList();
    },

    renderMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        // Calculate calendar grid
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayOfWeek = firstDay.getDay();
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        // Week day headers
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekDays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.style.fontWeight = 'bold';
            header.style.textAlign = 'center';
            header.style.padding = '10px';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Previous month days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevLastDate - i;
            this.renderDay(day, month - 1, year, true);
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= lastDate; day++) {
            const isToday = day === today.getDate() && 
                          month === today.getMonth() && 
                          year === today.getFullYear();
            this.renderDay(day, month, year, false, isToday);
        }

        // Next month days
        const remainingDays = 42 - (firstDayOfWeek + lastDate);
        for (let day = 1; day <= remainingDays; day++) {
            this.renderDay(day, month + 1, year, true);
        }
    },

    renderDay(day, month, year, isOtherMonth, isToday = false) {
        const grid = document.getElementById('calendar-grid');
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (isOtherMonth) dayEl.classList.add('other-month');
        if (isToday) dayEl.classList.add('today');

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = this.events.filter(e => e.date === dateStr);

        dayEl.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-events">
                ${dayEvents.map(() => '<span class="event-dot"></span>').join('')}
            </div>
        `;

        grid.appendChild(dayEl);
    },

    renderEventsList() {
        const container = document.getElementById('events-container');
        const today = new Date().toISOString().split('T')[0];
        
        // Sort events by date
        const sortedEvents = [...this.events]
            .filter(e => e.date >= today)
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.time || '').localeCompare(b.time || '');
            });

        if (sortedEvents.length === 0) {
            container.innerHTML = '<p style="color: #999;">No upcoming events</p>';
            return;
        }

        container.innerHTML = sortedEvents.map((event, index) => `
            <div class="event-item">
                <div class="event-info">
                    <h4>${this.escapeHtml(event.title)}</h4>
                    <p>${event.date}${event.time ? ' at ' + event.time : ''}</p>
                    ${event.description ? `<p>${this.escapeHtml(event.description)}</p>` : ''}
                </div>
                <button class="event-delete" data-index="${index}" data-id="${event.id}">Delete</button>
            </div>
        `).join('');

        // Attach delete listeners
        container.querySelectorAll('.event-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteEvent(id);
            });
        });
    },

    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.render();
        // Trigger save in main.js
        window.dispatchEvent(new CustomEvent('events-changed', { detail: this.events }));
    },

    addEvent(event) {
        event.id = Date.now().toString();
        this.events.push(event);
        this.render();
        window.dispatchEvent(new CustomEvent('events-changed', { detail: this.events }));
    },

    attachEventListeners() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};