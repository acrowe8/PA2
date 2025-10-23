document.addEventListener('DOMContentLoaded', () => {
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      try { localStorage.removeItem('currentStudentEmail'); } catch (e) {}
      window.location.href = './pages/studentSignin.html';
    });
  }

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
  
  // Checkout / Payment handling
  const paymentForm = document.getElementById('paymentForm');
  const cardholderNameEl = document.getElementById('cardholderName');
  const cardNumberEl = document.getElementById('cardNumber');
  const expiryEl = document.getElementById('expiry');
  const cvvEl = document.getElementById('cvv');
  const amountEl = document.getElementById('amount');
  const payBtn = document.getElementById('payBtn');
  const paymentMessageEl = document.getElementById('paymentMessage');

  function onlyDigits(value) {
    return (value || '').replace(/\D+/g, '');
  }

  function detectCardType(digits) {
    // Very lightweight detection for CVV length and spacing rules
    if (/^3[47]\d{0,13}$/.test(digits)) return 'amex';
    if (/^4\d{0,15}$/.test(digits)) return 'visa';
    if (/^5[1-5]\d{0,14}$/.test(digits)) return 'mastercard';
    if (/^6(?:011|5\d{2})\d{0,12}$/.test(digits)) return 'discover';
    return 'unknown';
  }

  function formatCardNumber(value) {
    const digits = onlyDigits(value);
    const type = detectCardType(digits);
    if (type === 'amex') {
      // 15 digits -> 4 6 5
      return digits
        .slice(0, 15)
        .replace(/(\d{4})(\d{0,6})(\d{0,5}).*/, (m, a, b, c) =>
          [a, b, c].filter(Boolean).join(' ')
        );
    }
    // Default groups of 4 up to 19 digits
    return digits
      .slice(0, 19)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
  }

  function luhnCheck(numberString) {
    const digits = onlyDigits(numberString);
    if (digits.length < 13) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits.charAt(i), 10);
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function formatExpiry(value) {
    const digits = onlyDigits(value).slice(0, 4);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  function parseExpiry(value) {
    const parts = formatExpiry(value).split('/');
    if (parts.length !== 2) return null;
    const mm = parseInt(parts[0], 10);
    const yy = parseInt(parts[1], 10);
    if (!Number.isFinite(mm) || !Number.isFinite(yy)) return null;
    return { mm, yy };
  }

  function isExpiryValid(value) {
    const parsed = parseExpiry(value);
    if (!parsed) return false;
    const { mm, yy } = parsed;
    if (mm < 1 || mm > 12) return false;
    // Interpret YY as 2000-2099 range
    const fullYear = 2000 + yy;
    const now = new Date();
    const exp = new Date(fullYear, mm, 0, 23, 59, 59, 999); // end of month
    // Card is valid through the end of the expiry month
    return exp >= new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function isCvvValid(cvvValue, numberString) {
    const cvvDigits = onlyDigits(cvvValue);
    const type = detectCardType(onlyDigits(numberString));
    if (type === 'amex') return cvvDigits.length === 4;
    return cvvDigits.length === 3;
  }

  function setPaymentMessage(text, isError = false) {
    if (!paymentMessageEl) return;
    paymentMessageEl.textContent = text;
    paymentMessageEl.style.color = isError ? 'var(--color-danger)' : 'var(--color-muted)';
  }

  function setProcessingState(isProcessing) {
    if (!payBtn) return;
    payBtn.disabled = isProcessing;
    payBtn.textContent = isProcessing ? 'Processing…' : 'Verify & Authorize';
  }

  // Simulated payment processor
  async function mockProcessorVerifyCard({ cardNumber, expiry, cvv, cardholderName }) {
    // Simulate network latency
    await new Promise((res) => setTimeout(res, 600));

    const digits = onlyDigits(cardNumber);
    if (!luhnCheck(digits)) {
      const error = new Error('Invalid card number.');
      error.code = 'invalid_number';
      throw error;
    }
    if (!isExpiryValid(expiry)) {
      const error = new Error('Card expired.');
      error.code = 'expired_card';
      throw error;
    }
    if (!isCvvValid(cvv, digits)) {
      const error = new Error('Invalid security code.');
      error.code = 'invalid_cvc';
      throw error;
    }
    // Simulate specific test declines by pattern
    if (digits.endsWith('0000')) {
      const error = new Error('Card was declined by the issuer.');
      error.code = 'card_declined';
      throw error;
    }
    return {
      token: 'tok_' + Math.random().toString(36).slice(2, 12),
      brand: detectCardType(digits),
      last4: digits.slice(-4),
      cardholderName: cardholderName || '',
      expiry: formatExpiry(expiry)
    };
  }

  async function mockProcessorAuthorizePayment({ token, amount }) {
    await new Promise((res) => setTimeout(res, 700));
    if (!token) {
      const error = new Error('Invalid payment token.');
      error.code = 'invalid_token';
      throw error;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('Invalid authorization amount.');
      error.code = 'invalid_amount';
      throw error;
    }
    // Simulate a rare insufficient funds case
    if (parsedAmount >= 9999) {
      const error = new Error('Insufficient funds.');
      error.code = 'insufficient_funds';
      throw error;
    }
    return {
      status: 'authorized',
      authorizationId: 'auth_' + Math.random().toString(36).slice(2, 12),
      amount: parsedAmount,
      currency: 'USD'
    };
  }

  // Input formatting handlers
  if (cardNumberEl) {
    cardNumberEl.addEventListener('input', (e) => {
      const target = e.target;
      const cursor = target.selectionStart;
      const prev = target.value;
      const formatted = formatCardNumber(prev);
      target.value = formatted;
      // Best-effort caret behavior: place at end on change
      try { target.setSelectionRange(formatted.length, formatted.length); } catch (err) {}
    });
  }
  if (expiryEl) {
    expiryEl.addEventListener('input', (e) => {
      const target = e.target;
      target.value = formatExpiry(target.value);
    });
  }
  if (cvvEl) {
    cvvEl.addEventListener('input', (e) => {
      const target = e.target;
      target.value = onlyDigits(target.value).slice(0, 4);
    });
  }

  // Keep amount in sync with duration if user hasn't modified amount manually
  const durationEl = document.getElementById('duration');
  if (amountEl) {
    amountEl.addEventListener('input', () => {
      amountEl.dataset.touched = 'true';
    });
  }
  function syncAmountFromDuration() {
    if (!durationEl || !amountEl) return;
    if (amountEl.dataset.touched === 'true') return; // user took control
    const minutes = Number(durationEl.value || 0);
    if (Number.isFinite(minutes) && minutes > 0) {
      amountEl.value = String(minutes);
    }
  }
  if (durationEl) {
    durationEl.addEventListener('change', syncAmountFromDuration);
    // initial sync
    syncAmountFromDuration();
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!cardNumberEl || !expiryEl || !cvvEl || !amountEl) return;

      const nameVal = cardholderNameEl ? cardholderNameEl.value.trim() : '';
      const numberVal = cardNumberEl.value;
      const expiryVal = expiryEl.value;
      const cvvVal = cvvEl.value;
      const amountVal = amountEl.value;

      // Client-side validation
      if (!nameVal) { setPaymentMessage('Enter the cardholder name.', true); return; }
      if (!luhnCheck(numberVal)) { setPaymentMessage('Enter a valid card number.', true); return; }
      if (!isExpiryValid(expiryVal)) { setPaymentMessage('Enter a valid, non-expired expiry (MM/YY).', true); return; }
      if (!isCvvValid(cvvVal, numberVal)) { setPaymentMessage('Enter a valid CVV.', true); return; }
      const amt = Number(amountVal);
      if (!Number.isFinite(amt) || amt <= 0) { setPaymentMessage('Enter a valid amount.', true); return; }

      setPaymentMessage('Verifying card…');
      setProcessingState(true);
      try {
        const verification = await mockProcessorVerifyCard({
          cardNumber: numberVal,
          expiry: expiryVal,
          cvv: cvvVal,
          cardholderName: nameVal
        });
        setPaymentMessage(`Card verified • •••• ${verification.last4}. Authorizing…`);

        const auth = await mockProcessorAuthorizePayment({ token: verification.token, amount: amt });
        setPaymentMessage(`Payment authorized (ID: ${auth.authorizationId}) for $${auth.amount}.`);

        // Persist last authorization for reference
        try {
          const key = currentEmail ? `studentLastAuth:${currentEmail}` : 'studentLastAuth';
          localStorage.setItem(key, JSON.stringify({
            id: auth.authorizationId,
            amount: auth.amount,
            currency: auth.currency,
            last4: verification.last4,
            brand: verification.brand,
            at: new Date().toISOString()
          }));
        } catch (err) {}

        // Record financial transaction to system records for Admin reports
        try {
          const txKey = 'financialTransactions';
          const existing = (function(){ try { return JSON.parse(localStorage.getItem(txKey) || '[]'); } catch(e) { return []; } })();
          // Best-effort instrument inference from current selection or profile
          let instrumentForPayment = '';
          try {
            const instrEl = document.getElementById('instrument');
            if (instrEl && instrEl.value) instrumentForPayment = instrEl.value;
          } catch (e) {}
          if (!instrumentForPayment) {
            const prof = loadProfile();
            instrumentForPayment = prof.instrument || 'Unknown';
          }
          const transaction = {
            id: auth.authorizationId,
            studentEmail: currentEmail || '',
            instrument: instrumentForPayment,
            amount: auth.amount,
            currency: auth.currency || 'USD',
            at: new Date().toISOString()
          };
          existing.push(transaction);
          localStorage.setItem(txKey, JSON.stringify(existing));
        } catch (err) {
          // swallow; admin page can still function with prior records
        }
      } catch (err) {
        const message = (err && err.message) ? err.message : 'Payment failed.';
        setPaymentMessage(message, true);
      } finally {
        setProcessingState(false);
      }
    });
  }
});
