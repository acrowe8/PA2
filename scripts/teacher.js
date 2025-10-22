document.addEventListener('DOMContentLoaded', () => {
  // Auth/session
  const currentEmail = (function () {
    try { return localStorage.getItem('currentTeacherEmail') || ''; } catch (e) { return ''; }
  })();

  // If no auth context, send to sign-in
  if (!currentEmail) {
    window.location.href = './pages/teachsignin.html';
    return;
  }

  const welcomeNameEl = document.getElementById('welcomeName');
  const profileEmailEl = document.getElementById('profileEmail');
  if (profileEmailEl) profileEmailEl.value = currentEmail;

  // Storage keys scoped by teacher email
  const profileKey = `teacherProfile:${currentEmail}`;
  const instrumentsKey = `teacherInstruments:${currentEmail}`;
  const availabilityKey = `teacherAvailability:${currentEmail}`;

  // Helpers
  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (e) { return fallback; }
  }
  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ----- Profile -----
  function loadProfile() { return loadJson(profileKey, {}); }
  function saveProfile(data) { saveJson(profileKey, data); }

  function updateWelcome() {
    const profile = loadProfile();
    const name = profile.name || currentEmail || 'Teacher';
    if (welcomeNameEl) welcomeNameEl.textContent = name;
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    const nameInput = document.getElementById('profileName');
    const profile = loadProfile();
    if (nameInput) nameInput.value = profile.name || '';

    const profileMsg = document.getElementById('profileMessage');
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        name: nameInput ? nameInput.value.trim() : '',
        email: currentEmail
      };
      saveProfile(payload);
      updateWelcome();
      if (profileMsg) { profileMsg.textContent = 'Profile saved.'; setTimeout(() => { profileMsg.textContent = ''; }, 2000); }
    });
  }

  updateWelcome();

  // ----- Instruments -----
  function loadInstruments() { return loadJson(instrumentsKey, []); }
  function saveInstruments(list) { saveJson(instrumentsKey, list); }

  const instrumentsForm = document.getElementById('instrumentsForm');
  const instrumentsChecklist = document.getElementById('instrumentsChecklist');
  const instrumentsMsg = document.getElementById('instrumentsMessage');

  function ensureCheckboxForInstrument(name) {
    if (!instrumentsChecklist) return;
    const normalized = String(name).trim();
    if (!normalized) return;
    const existing = Array.from(instrumentsChecklist.querySelectorAll('input[type="checkbox"]'))
      .some((el) => el.value.toLowerCase() === normalized.toLowerCase());
    if (existing) return;

    const label = document.createElement('label');
    label.className = 'control';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = normalized;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + normalized));
    instrumentsChecklist.appendChild(label);
  }

  // Initialize from saved instruments (include customs)
  const savedInstruments = loadInstruments();
  savedInstruments.forEach((name) => ensureCheckboxForInstrument(name));
  // Check the saved ones
  if (instrumentsChecklist) {
    Array.from(instrumentsChecklist.querySelectorAll('input[type="checkbox"]')).forEach((box) => {
      box.checked = savedInstruments.some((n) => n.toLowerCase() === box.value.toLowerCase());
    });
  }

  const addInstrumentBtn = document.getElementById('addInstrumentBtn');
  const customInstrumentInput = document.getElementById('customInstrument');
  if (addInstrumentBtn && customInstrumentInput) {
    addInstrumentBtn.addEventListener('click', () => {
      const name = customInstrumentInput.value.trim();
      if (!name) return;
      ensureCheckboxForInstrument(name);
      // Also check it by default
      const box = Array.from(instrumentsChecklist.querySelectorAll('input[type="checkbox"]'))
        .find((el) => el.value.toLowerCase() === name.toLowerCase());
      if (box) box.checked = true;
      customInstrumentInput.value = '';
    });
  }

  if (instrumentsForm) {
    instrumentsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const selected = Array.from(instrumentsChecklist.querySelectorAll('input[type="checkbox"]:checked'))
        .map((el) => el.value.trim())
        .filter(Boolean);
      saveInstruments(selected);
      if (instrumentsMsg) { instrumentsMsg.textContent = 'Instruments saved.'; setTimeout(() => { instrumentsMsg.textContent = ''; }, 2000); }
    });
  }

  // ----- Availability -----
  function loadAvailability() { return loadJson(availabilityKey, []); }
  function saveAvailability(list) { saveJson(availabilityKey, list); }

  function minutesOf(day, hhmm) {
    // Convert HH:MM into minutes for comparison only
    const [h, m] = String(hhmm).split(':').map((t) => parseInt(t || '0', 10));
    return h * 60 + m;
  }

  const availabilityForm = document.getElementById('availabilityForm');
  const availabilityList = document.getElementById('availabilityList');
  const availabilityMsg = document.getElementById('availabilityMessage');

  function renderAvailability() {
    if (!availabilityList) return;
    const items = loadAvailability();
    availabilityList.innerHTML = '';
    if (items.length === 0) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No time slots added yet.';
      availabilityList.appendChild(p);
      return;
    }

    // Sort by weekday order then start time
    const order = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    items.sort((a, b) => (order[a.day] - order[b.day]) || minutesOf(a.day, a.start) - minutesOf(b.day, b.start));

    items.forEach((slot) => {
      const card = document.createElement('article');
      card.className = 'card';

      const block = document.createElement('div');
      block.className = 'inline';

      const title = document.createElement('div');
      title.textContent = `${slot.day} ${slot.start}–${slot.end}` + (slot.modality ? ` • ${slot.modality}` : '');

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn';
      removeBtn.textContent = 'Remove';
      removeBtn.dataset.id = slot.id;

      block.appendChild(title);
      block.appendChild(removeBtn);
      card.appendChild(block);
      availabilityList.appendChild(card);
    });
  }

  if (availabilityForm) {
    const dayEl = document.getElementById('availDay');
    const startEl = document.getElementById('availStart');
    const endEl = document.getElementById('availEnd');
    const modalityEl = document.getElementById('availModality');

    availabilityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const day = dayEl ? dayEl.value : '';
      const start = startEl ? startEl.value : '';
      const end = endEl ? endEl.value : '';
      const modality = modalityEl ? modalityEl.value : '';
      if (!day || !start || !end) return;
      if (minutesOf(day, end) <= minutesOf(day, start)) {
        if (availabilityMsg) { availabilityMsg.textContent = 'End time must be after start time.'; setTimeout(() => { availabilityMsg.textContent = ''; }, 2500); }
        return;
      }

      const slot = { id: String(Date.now()) + Math.random().toString(16).slice(2), day, start, end, modality };
      const list = loadAvailability();
      list.push(slot);
      saveAvailability(list);
      renderAvailability();
      if (availabilityMsg) { availabilityMsg.textContent = 'Time slot added.'; setTimeout(() => { availabilityMsg.textContent = ''; }, 2000); }
      availabilityForm.reset();
    });

    if (availabilityList) {
      availabilityList.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.matches('button.btn') && target.textContent && target.textContent.toLowerCase().includes('remove')) {
          const id = target.dataset.id;
          if (!id) return;
          const next = loadAvailability().filter((s) => s.id !== id);
          saveAvailability(next);
          renderAvailability();
        }
      });
    }
  }

  renderAvailability();
});
