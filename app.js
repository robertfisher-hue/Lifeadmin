// Data storage keys
const STORAGE_KEYS = {
    MORNING: 'lifeadmin_morning_entries',
    EVENING: 'lifeadmin_evening_entries',
    DRESDEN: 'lifeadmin_dresden_checklist',
    BERLIN: 'lifeadmin_berlin_checklist',
    ROTATING_INDEX: 'lifeadmin_rotating_index'
};

// Checklist items
const CHECKLISTS = {
    dresden: [
        'Fenster Schlafzimmer zu',
        'Verstärker aus',
        'Fenster Küche zu',
        'Herd aus',
        'Herdplatte aus',
        'Steckdose Küche leer',
        'Wasserhahn Küche zu',
        'Wasserhahn Bad zu',
        'Fenster Bad zu',
        'Spülung aus'
    ],
    berlin: [
        'Fenster Schlafzimmer zu',
        'Wasserhahn Bad zu',
        'Spülung aus',
        'Mehrfachstecker Küche aus',
        'Herd aus',
        'Fenster Küche zu',
        'Fenster Dusche zu',
        'Wasserhahn zu'
    ]
};

// Rotating morning prompts
const ROTATING_PROMPTS = [
    'Bei wem willst du dich heute proaktiv melden?',
    'Was willst du demnächst mal unternehmen?',
    'Welches Haushaltsprojekt willst du dir diese Woche vornehmen?',
    'Welchen Skill willst du gerne verbessern?',
    'Was machst du heute zum Abendessen?',
    'Was hat dir diese Woche besonders gutgetan?',
    'Wofür bist du gerade besonders dankbar?'
];

// Utility functions
function getDateString() {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `${dayName}, ${day}. ${month} ${year}`;
}

function getDateKey() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function loadFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Initialize screen-specific content
    if (screenId === 'morning-checkin') {
        initMorningCheckin();
    } else if (screenId === 'evening-checkin') {
        initEveningCheckin();
    } else if (screenId === 'dresden-checklist') {
        initChecklist('dresden');
    } else if (screenId === 'berlin-checklist') {
        initChecklist('berlin');
    } else if (screenId === 'history') {
        showHistoryTab('morning');
    }
}

// Morning Check-in
function initMorningCheckin() {
    document.getElementById('morning-date').textContent = getDateString();
    
    // Set rotating prompt
    let rotatingIndex = loadFromStorage(STORAGE_KEYS.ROTATING_INDEX, 0);
    document.getElementById('morning-rotating-label').textContent = ROTATING_PROMPTS[rotatingIndex];
    
    // Clear form
    document.getElementById('morning-form').reset();
}

document.getElementById('morning-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const entry = {
        date: getDateKey(),
        dateDisplay: getDateString(),
        q1: document.getElementById('morning-q1').value,
        q2: document.getElementById('morning-q2').value,
        q3: document.getElementById('morning-q3').value,
        q4: document.getElementById('morning-q4').value,
        rotatingPrompt: document.getElementById('morning-rotating-label').textContent
    };
    
    // Save entry
    const entries = loadFromStorage(STORAGE_KEYS.MORNING);
    entries.push(entry);
    saveToStorage(STORAGE_KEYS.MORNING, entries);
    
    // Increment rotating prompt index
    let rotatingIndex = loadFromStorage(STORAGE_KEYS.ROTATING_INDEX, 0);
    rotatingIndex = (rotatingIndex + 1) % ROTATING_PROMPTS.length;
    saveToStorage(STORAGE_KEYS.ROTATING_INDEX, rotatingIndex);
    
    // Show success and return to menu
    alert('Morning Check-in gespeichert! ☀️');
    showScreen('main-menu');
});

// Evening Check-in
function initEveningCheckin() {
    document.getElementById('evening-date').textContent = getDateString();
    
    // Setup sliders
    setupSlider('evening-q1');
    setupSlider('evening-q4');
    setupSlider('evening-q5');
    
    // Clear form
    document.getElementById('evening-form').reset();
    document.getElementById('training-done-group').style.display = 'none';
}

function setupSlider(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(`${sliderId}-value`);
    
    slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;
    });
}

function toggleTrainingQuestion() {
    const planned = document.querySelector('input[name="training-planned"]:checked').value;
    const doneGroup = document.getElementById('training-done-group');
    
    if (planned === 'yes') {
        doneGroup.style.display = 'block';
    } else {
        doneGroup.style.display = 'none';
    }
}

document.getElementById('evening-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const trainingPlanned = document.querySelector('input[name="training-planned"]:checked').value;
    const trainingDone = trainingPlanned === 'yes' 
        ? (document.querySelector('input[name="training-done"]:checked')?.value || null)
        : null;
    
    const entry = {
        date: getDateKey(),
        dateDisplay: getDateString(),
        nutrition: parseInt(document.getElementById('evening-q1').value),
        trainingPlanned: trainingPlanned === 'yes',
        trainingDone: trainingDone === 'yes',
        attention: parseInt(document.getElementById('evening-q4').value),
        anxiety: parseInt(document.getElementById('evening-q5').value)
    };
    
    // Save entry
    const entries = loadFromStorage(STORAGE_KEYS.EVENING);
    entries.push(entry);
    saveToStorage(STORAGE_KEYS.EVENING, entries);
    
    // Show success and return to menu
    alert('Evening Check-in gespeichert! 🌙');
    showScreen('main-menu');
});

// Checklists
function initChecklist(location) {
    const listElement = document.getElementById(`${location}-list`);
    const savedState = loadFromStorage(STORAGE_KEYS[location.toUpperCase()], {});
    
    listElement.innerHTML = '';
    
    CHECKLISTS[location].forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item' + (savedState[index] ? ' checked' : '');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${location}-item-${index}`;
        checkbox.checked = savedState[index] || false;
        checkbox.addEventListener('change', () => {
            savedState[index] = checkbox.checked;
            saveToStorage(STORAGE_KEYS[location.toUpperCase()], savedState);
            itemDiv.classList.toggle('checked', checkbox.checked);
        });
        
        const label = document.createElement('label');
        label.htmlFor = `${location}-item-${index}`;
        label.textContent = item;
        
        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        listElement.appendChild(itemDiv);
        
        // Make entire div clickable
        itemDiv.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.click();
            }
        });
    });
}

function resetChecklist(location) {
    if (confirm(`Möchtest du die ${location.charAt(0).toUpperCase() + location.slice(1)}-Checkliste wirklich zurücksetzen?`)) {
        saveToStorage(STORAGE_KEYS[location.toUpperCase()], {});
        initChecklist(location);
    }
}

// History
function showHistoryTab(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const contentDiv = document.getElementById('history-content');
    
    if (type === 'morning') {
        showMorningHistory(contentDiv);
    } else {
        showEveningHistory(contentDiv);
    }
}

function showMorningHistory(container) {
    const entries = loadFromStorage(STORAGE_KEYS.MORNING);
    
    if (entries.length === 0) {
        container.innerHTML = '<div class="no-data">Noch keine Morning Check-ins vorhanden</div>';
        return;
    }
    
    // Show last 10 entries, most recent first
    const recentEntries = entries.slice(-10).reverse();
    
    let html = '';
    recentEntries.forEach(entry => {
        html += `
            <div class="history-entry">
                <div class="history-entry-date">${entry.dateDisplay}</div>
                <div class="history-entry-content">
                    <div class="history-entry-item">
                        <div class="history-entry-question">Worauf freust du dich heute besonders?</div>
                        <div class="history-entry-answer">${entry.q1}</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">Was willst du heute erreichen?</div>
                        <div class="history-entry-answer">${entry.q2}</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">Was willst du heute vermeiden?</div>
                        <div class="history-entry-answer">${entry.q3}</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">${entry.rotatingPrompt}</div>
                        <div class="history-entry-answer">${entry.q4}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showEveningHistory(container) {
    const entries = loadFromStorage(STORAGE_KEYS.EVENING);
    
    if (entries.length === 0) {
        container.innerHTML = '<div class="no-data">Noch keine Evening Check-ins vorhanden</div>';
        return;
    }
    
    // Show charts
    const last14 = entries.slice(-14);
    
    let html = '<div class="chart-container">';
    html += '<div class="chart-title">Ernährungszufriedenheit (letzte 14 Tage)</div>';
    html += createSimpleChart(last14.map(e => e.nutrition));
    html += '</div>';
    
    html += '<div class="chart-container">';
    html += '<div class="chart-title">Aufmerksamkeitskontrolle (letzte 14 Tage)</div>';
    html += createSimpleChart(last14.map(e => e.attention));
    html += '</div>';
    
    html += '<div class="chart-container">';
    html += '<div class="chart-title">Umgang mit Ängsten (letzte 14 Tage)</div>';
    html += createSimpleChart(last14.map(e => e.anxiety));
    html += '</div>';
    
    // Show last 5 entries
    html += '<h3 style="margin: 30px 0 15px 0;">Letzte Einträge</h3>';
    const recentEntries = entries.slice(-5).reverse();
    
    recentEntries.forEach(entry => {
        html += `
            <div class="history-entry">
                <div class="history-entry-date">${entry.dateDisplay}</div>
                <div class="history-entry-content">
                    <div class="history-entry-item">
                        <div class="history-entry-question">Ernährung</div>
                        <div class="history-entry-answer">${entry.nutrition}/5</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">Krafttraining geplant</div>
                        <div class="history-entry-answer">${entry.trainingPlanned ? 'Ja' : 'Nein'}${entry.trainingPlanned ? ` (gemacht: ${entry.trainingDone ? 'Ja' : 'Nein'})` : ''}</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">Aufmerksamkeit</div>
                        <div class="history-entry-answer">${entry.attention}/5</div>
                    </div>
                    <div class="history-entry-item">
                        <div class="history-entry-question">Umgang mit Ängsten</div>
                        <div class="history-entry-answer">${entry.anxiety}/5</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function createSimpleChart(values) {
    if (values.length === 0) return '<div class="no-data">Keine Daten</div>';
    
    const max = 5;
    const width = 100 / values.length;
    
    let html = '<div style="display: flex; align-items: flex-end; height: 120px; gap: 4px;">';
    
    values.forEach(value => {
        const height = (value / max) * 100;
        html += `<div style="flex: 1; background: rgba(255,255,255,0.3); height: ${height}%; border-radius: 4px 4px 0 0; min-width: 0; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; font-size: 0.8rem; font-weight: 600;">${value}</div>`;
    });
    
    html += '</div>';
    return html;
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    showScreen('main-menu');
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    });
}
