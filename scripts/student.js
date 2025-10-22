document.addEventListener('DOMContentLoaded', () => {
  const currentEmail = (function () {
    try { return localStorage.getItem('currentStudentEmail') || ''; } catch (e) { return ''; }
  })();

  const welcomeNameEl = document.getElementById('welcomeName');
  const profileEmailEl = document.getElementById('profileEmail');
  if (profileEmailEl && currentEmail) profileEmailEl.value = currentEmail;

  const profileKey = currentEmail ? `studentProfile:${currentEmail}` : 'studentProfile';
  const bookingsKey = currentEmail ? `studentBookings:${currentEmail}` : 'studentBookings';

  function loadProfile() {
    try { return JSON.parse(localStorage.getItem(profileKey) || '{}'); } catch (e) { return {}; }
  }

  function saveProfile(data) {
    try { localStorage.setItem(profileKey, JSON.stringify(data)); } catch (e) {}
  }

  function updateWelcome() {
    const profile = loadProfile();
    const name = profile.name || (currentEmail || 'Student');
    if (welcomeNameEl) welcomeNameEl.textContent = name;
  }

  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    const nameInput = document.getElementById('profileName');
    const instrSelect = document.getElementById('profileInstrument');
    const levelSelect = document.getElementById('profileLevel');
    const profile = loadProfile();
    if (nameInput) nameInput.value = profile.name || '';
    if (instrSelect) instrSelect.value = profile.instrument || '';
    if (levelSelect) levelSelect.value = profile.level || '';

    const profileMsg = document.getElementById('profileMessage');
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        name: nameInput ? nameInput.value.trim() : '',
        email: currentEmail || '',
        instrument: instrSelect ? instrSelect.value : '',
        level: levelSelect ? levelSelect.value : ''
      };
      saveProfile(payload);
      updateWelcome();
      if (profileMsg) { profileMsg.textContent = 'Profile saved.'; setTimeout(() => { profileMsg.textContent = ''; }, 2000); }
    });
  }

  updateWelcome();

  const bookingForm = document.getElementById('bookingForm');
  const lessonDate = document.getElementById('lessonDate');
  const lessonTime = document.getElementById('lessonTime');

  if (lessonDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    lessonDate.min = `${yyyy}-${mm}-${dd}`;
  }

  function loadBookings() {
    try { return JSON.parse(localStorage.getItem(bookingsKey) || '[]'); } catch (e) { return []; }
  }
  function saveBookings(list) {
    try { localStorage.setItem(bookingsKey, JSON.stringify(list)); } catch (e) {}
  }

  function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  function renderBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    const items = loadBookings().sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    container.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'No lesson requests yet.';
      container.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'card';

      const block = document.createElement('div');
      block.className = 'stack';

      const title = document.createElement('h3');
      title.textContent = `${item.instrument} with ${item.teacher}`;

      const when = document.createElement('p');
      when.className = 'muted';
      when.textContent = `${formatDateTime(item.datetime)} • ${item.duration} min • ${item.modality}`;

      const notes = document.createElement('p');
      if (item.notes) notes.textContent = item.notes;

      const actions = document.createElement('div');
      actions.className = 'inline';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn';
      cancelBtn.textContent = 'Cancel request';
      cancelBtn.dataset.id = item.id;
      actions.appendChild(cancelBtn);

      block.appendChild(title);
      block.appendChild(when);
      if (item.notes) block.appendChild(notes);
      block.appendChild(actions);

      card.appendChild(block);
      container.appendChild(card);
    });
  }

  if (bookingForm) {
    const instrumentEl = document.getElementById('instrument');
    const teacherEl = document.getElementById('teacher');
    const modalityEl = document.getElementById('modality');
    const durationEl = document.getElementById('duration');
    const notesEl = document.getElementById('notes');
    const messageEl = document.getElementById('bookingMessage');

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dateVal = lessonDate ? lessonDate.value : '';
      const timeVal = lessonTime ? lessonTime.value : '';
      if (!dateVal || !timeVal) return;
      const dt = new Date(`${dateVal}T${timeVal}`);

      const booking = {
        id: String(Date.now()) + Math.random().toString(16).slice(2),
        instrument: instrumentEl ? instrumentEl.value : '',
        teacher: teacherEl ? teacherEl.value : '',
        modality: modalityEl ? modalityEl.value : '',
        duration: durationEl ? durationEl.value : '',
        datetime: dt.toISOString(),
        notes: notesEl ? notesEl.value.trim() : '',
        status: 'requested',
        createdAt: new Date().toISOString()
      };

      const list = loadBookings();
      list.push(booking);
      saveBookings(list);

      if (messageEl) { messageEl.textContent = 'Lesson request submitted.'; setTimeout(() => { messageEl.textContent = ''; }, 2000); }
      bookingForm.reset();
      renderBookings();
    });

    const bookingsList = document.getElementById('bookingsList');
    if (bookingsList) {
      bookingsList.addEventListener('click', (e) => {
        const target = e.target;
        if (target && target.matches('button.btn') && target.textContent && target.textContent.toLowerCase().includes('cancel')) {
          const id = target.dataset.id;
          if (!id) return;
          const list = loadBookings().filter((item) => item.id !== id);
          saveBookings(list);
          renderBookings();
        }
      });
    }
  }

  renderBookings();
});
