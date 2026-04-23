const state = {
  vacations: [],
  selectedId: null,
  password: '1234',
};

const el = {
  authOverlay: document.getElementById('authOverlay'),
  unlockForm: document.getElementById('unlockForm'),
  passwordInput: document.getElementById('passwordInput'),
  authError: document.getElementById('authError'),
  vacationList: document.getElementById('vacationList'),
  vacationCountBadge: document.getElementById('vacationCountBadge'),
  vacationForm: document.getElementById('vacationForm'),
  plannerPane: document.getElementById('plannerPane'),
  emptyState: document.getElementById('emptyState'),
  vacationTitle: document.getElementById('vacationTitle'),
  vacationMetaForm: document.getElementById('vacationMetaForm'),
  deleteVacationBtn: document.getElementById('deleteVacationBtn'),
  placeForm: document.getElementById('placeForm'),
  placeList: document.getElementById('placeList'),
  expenseForm: document.getElementById('expenseForm'),
  expenseList: document.getElementById('expenseList'),
  budgetSummary: document.getElementById('budgetSummary'),
  todoForm: document.getElementById('todoForm'),
  todoList: document.getElementById('todoList'),
  bookingForm: document.getElementById('bookingForm'),
  bookingList: document.getElementById('bookingList'),
  packingForm: document.getElementById('packingForm'),
  packingList: document.getElementById('packingList'),
  contactForm: document.getElementById('contactForm'),
  contactList: document.getElementById('contactList'),
  statPlanned: document.getElementById('statPlanned'),
  statRemaining: document.getElementById('statRemaining'),
  statPlaces: document.getElementById('statPlaces'),
  statTodos: document.getElementById('statTodos'),
  syncStatus: document.getElementById('syncStatus'),
  syncNowBtn: document.getElementById('syncNowBtn'),
  changePasswordBtn: document.getElementById('changePasswordBtn'),
  passwordDialog: document.getElementById('passwordDialog'),
  passwordForm: document.getElementById('passwordForm'),
  passwordMessage: document.getElementById('passwordMessage'),
};

let saveTimer = null;

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeVacation(v) {
  return {
    id: v.id || uid(),
    name: v.name || 'Untitled Vacation',
    destination: v.destination || '',
    startDate: v.startDate || '',
    endDate: v.endDate || '',
    budget: Number(v.budget || 0),
    currency: (v.currency || 'USD').toUpperCase(),
    travelers: v.travelers || '',
    notes: v.notes || '',
    places: Array.isArray(v.places) ? v.places : [],
    expenses: Array.isArray(v.expenses) ? v.expenses : [],
    todos: Array.isArray(v.todos) ? v.todos : [],
    bookings: Array.isArray(v.bookings) ? v.bookings : [],
    packing: Array.isArray(v.packing) ? v.packing : [],
    contacts: Array.isArray(v.contacts) ? v.contacts : [],
  };
}

function selectedVacation() {
  return state.vacations.find((v) => v.id === state.selectedId) || null;
}

function setSyncStatus(message) {
  el.syncStatus.textContent = `Sync: ${message}`;
}

async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

async function loadRemoteState() {
  try {
    setSyncStatus('Loading...');
    const [data, settings] = await Promise.all([apiGet('/api/data'), apiGet('/api/password')]);
    state.vacations = (data.vacations || []).map(normalizeVacation);
    state.selectedId = data.selectedId || state.vacations[0]?.id || null;
    state.password = settings.password || '1234';
    setSyncStatus('Connected');
  } catch {
    setSyncStatus('Offline');
    alert('Unable to connect to JSON API. Start server with: node server.js');
  }
}

async function persistStateNow() {
  try {
    setSyncStatus('Saving...');
    await apiPost('/api/data', {
      vacations: state.vacations,
      selectedId: state.selectedId,
    });
    setSyncStatus(`Saved ${new Date().toLocaleTimeString()}`);
  } catch {
    setSyncStatus('Save failed');
  }
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistStateNow();
  }, 400);
}

function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function renderVacations() {
  el.vacationList.innerHTML = '';
  el.vacationCountBadge.textContent = `${state.vacations.length}`;
  state.vacations.forEach((vacation) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = `vacation-btn ${vacation.id === state.selectedId ? 'active' : ''}`;
    button.textContent = `${vacation.name} • ${vacation.destination || 'No destination'}`;
    button.onclick = () => {
      state.selectedId = vacation.id;
      queueSave();
      render();
    };
    li.appendChild(button);
    el.vacationList.appendChild(li);
  });
}

function createCardItem({ title, details = [], link, onDelete, toggle }) {
  const li = document.createElement('li');
  const top = document.createElement('div');
  top.className = 'item-top';
  const heading = document.createElement('strong');
  heading.textContent = title;
  top.appendChild(heading);

  const actions = document.createElement('div');
  actions.className = 'item-actions';
  if (toggle) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = toggle.checked;
    checkbox.onchange = () => toggle.onChange(checkbox.checked);
    actions.appendChild(checkbox);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-secondary';
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = onDelete;
  actions.appendChild(deleteBtn);

  top.appendChild(actions);
  li.appendChild(top);

  details.filter(Boolean).forEach((detail) => {
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = detail;
    li.appendChild(meta);
  });

  if (link) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.textContent = link;
    li.appendChild(anchor);
  }

  return li;
}

function mutateSelected(mutator) {
  const vacation = selectedVacation();
  if (!vacation) return;
  mutator(vacation);
  queueSave();
  render();
}

function renderStats(vacation) {
  const planned = vacation.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = Number(vacation.budget || 0) - planned;
  const openTodos = vacation.todos.filter((t) => !t.done).length;

  el.statPlanned.textContent = formatMoney(planned, vacation.currency);
  el.statRemaining.textContent = formatMoney(remaining, vacation.currency);
  el.statPlaces.textContent = `${vacation.places.length}`;
  el.statTodos.textContent = `${openTodos}`;
  el.budgetSummary.textContent = `Planned ${formatMoney(planned, vacation.currency)} • Remaining ${formatMoney(remaining, vacation.currency)}`;
}

function renderSelectedVacation() {
  const vacation = selectedVacation();
  if (!vacation) {
    el.plannerPane.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
    el.deleteVacationBtn.classList.add('hidden');
    el.vacationTitle.textContent = 'Select a vacation';
    return;
  }

  el.plannerPane.classList.remove('hidden');
  el.emptyState.classList.add('hidden');
  el.deleteVacationBtn.classList.remove('hidden');
  el.vacationTitle.textContent = vacation.name;

  Object.entries({
    destination: vacation.destination,
    travelers: vacation.travelers,
    startDate: vacation.startDate,
    endDate: vacation.endDate,
    budget: vacation.budget,
    currency: vacation.currency,
    notes: vacation.notes,
  }).forEach(([field, value]) => {
    el.vacationMetaForm.elements[field].value = value;
  });

  renderStats(vacation);

  const sections = [
    ['placeList', vacation.places, (place) => createCardItem({ title: place.name, details: [place.address && `Address: ${place.address}`, place.bestTime && `Best time: ${place.bestTime}`, place.estimatedCost ? `Estimated cost: ${formatMoney(place.estimatedCost, vacation.currency)}` : '', place.todo && `Todo: ${place.todo}`, place.notes && `Notes: ${place.notes}`], link: place.mapLink, onDelete: () => mutateSelected((v) => { v.places = v.places.filter((x) => x.id !== place.id); }) })],
    ['expenseList', vacation.expenses, (expense) => createCardItem({ title: `${expense.label} — ${formatMoney(expense.amount, vacation.currency)}`, details: [expense.category && `Category: ${expense.category}`, expense.paidBy && `Paid by: ${expense.paidBy}`], onDelete: () => mutateSelected((v) => { v.expenses = v.expenses.filter((x) => x.id !== expense.id); }) })],
    ['todoList', vacation.todos, (todo) => createCardItem({ title: todo.done ? `✅ ${todo.task}` : todo.task, details: [todo.dueDate && `Due: ${todo.dueDate}`, `Priority: ${todo.priority}`], toggle: { checked: todo.done, onChange: (checked) => mutateSelected((v) => { const current = v.todos.find((i) => i.id === todo.id); if (current) current.done = checked; }) }, onDelete: () => mutateSelected((v) => { v.todos = v.todos.filter((x) => x.id !== todo.id); }) })],
    ['bookingList', vacation.bookings, (booking) => createCardItem({ title: `${booking.type}${booking.provider ? ` • ${booking.provider}` : ''}`, details: [booking.confirmation && `Confirmation: ${booking.confirmation}`], link: booking.link, onDelete: () => mutateSelected((v) => { v.bookings = v.bookings.filter((x) => x.id !== booking.id); }) })],
    ['packingList', vacation.packing, (item) => createCardItem({ title: item.done ? `✅ ${item.item}` : item.item, toggle: { checked: item.done, onChange: (checked) => mutateSelected((v) => { const current = v.packing.find((x) => x.id === item.id); if (current) current.done = checked; }) }, onDelete: () => mutateSelected((v) => { v.packing = v.packing.filter((x) => x.id !== item.id); }) })],
    ['contactList', vacation.contacts, (contact) => createCardItem({ title: contact.name, details: [contact.phone && `Phone: ${contact.phone}`, contact.details && `Details: ${contact.details}`], onDelete: () => mutateSelected((v) => { v.contacts = v.contacts.filter((x) => x.id !== contact.id); }) })],
  ];

  sections.forEach(([id, list, renderer]) => {
    el[id].innerHTML = '';
    list.forEach((item) => el[id].appendChild(renderer(item)));
  });
}

function render() {
  renderVacations();
  renderSelectedVacation();
}

el.unlockForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (el.passwordInput.value === state.password) {
    sessionStorage.setItem('vacation_planner_unlocked', 'true');
    el.authOverlay.classList.add('hidden');
    el.authError.classList.add('hidden');
    el.passwordInput.value = '';
  } else {
    el.authError.classList.remove('hidden');
  }
});

el.vacationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(el.vacationForm);
  const vacation = normalizeVacation({
    id: uid(),
    name: (form.get('name') || '').toString().trim(),
    destination: (form.get('destination') || '').toString().trim(),
    startDate: (form.get('startDate') || '').toString(),
    endDate: (form.get('endDate') || '').toString(),
    budget: Number(form.get('budget') || 0),
    currency: (form.get('currency') || 'USD').toString(),
  });
  state.vacations.unshift(vacation);
  state.selectedId = vacation.id;
  el.vacationForm.reset();
  el.vacationForm.elements.currency.value = 'USD';
  queueSave();
  render();
});

el.vacationMetaForm.addEventListener('submit', (event) => {
  event.preventDefault();
  mutateSelected((vacation) => {
    const form = new FormData(el.vacationMetaForm);
    vacation.destination = (form.get('destination') || '').toString();
    vacation.travelers = (form.get('travelers') || '').toString();
    vacation.startDate = (form.get('startDate') || '').toString();
    vacation.endDate = (form.get('endDate') || '').toString();
    vacation.budget = Number(form.get('budget') || 0);
    vacation.currency = (form.get('currency') || 'USD').toString().toUpperCase();
    vacation.notes = (form.get('notes') || '').toString();
  });
});

el.deleteVacationBtn.onclick = () => {
  const vacation = selectedVacation();
  if (!vacation) return;
  if (!window.confirm(`Delete vacation "${vacation.name}"?`)) return;
  state.vacations = state.vacations.filter((v) => v.id !== vacation.id);
  state.selectedId = state.vacations[0]?.id || null;
  queueSave();
  render();
};

function bindAddForm(formElement, key, mapper) {
  formElement.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(formElement);
    mutateSelected((vacation) => {
      vacation[key].unshift({ id: uid(), ...mapper(data) });
    });
    formElement.reset();
  });
}

bindAddForm(el.placeForm, 'places', (form) => ({
  name: (form.get('name') || '').toString(),
  address: (form.get('address') || '').toString(),
  mapLink: (form.get('mapLink') || '').toString(),
  estimatedCost: Number(form.get('estimatedCost') || 0),
  bestTime: (form.get('bestTime') || '').toString(),
  todo: (form.get('todo') || '').toString(),
  notes: (form.get('notes') || '').toString(),
}));

bindAddForm(el.expenseForm, 'expenses', (form) => ({
  label: (form.get('label') || '').toString(),
  category: (form.get('category') || '').toString(),
  amount: Number(form.get('amount') || 0),
  paidBy: (form.get('paidBy') || '').toString(),
}));

bindAddForm(el.todoForm, 'todos', (form) => ({
  task: (form.get('task') || '').toString(),
  dueDate: (form.get('dueDate') || '').toString(),
  priority: (form.get('priority') || 'Medium').toString(),
  done: false,
}));

bindAddForm(el.bookingForm, 'bookings', (form) => ({
  type: (form.get('type') || '').toString(),
  provider: (form.get('provider') || '').toString(),
  confirmation: (form.get('confirmation') || '').toString(),
  link: (form.get('link') || '').toString(),
}));

bindAddForm(el.packingForm, 'packing', (form) => ({
  item: (form.get('item') || '').toString(),
  done: false,
}));

bindAddForm(el.contactForm, 'contacts', (form) => ({
  name: (form.get('name') || '').toString(),
  phone: (form.get('phone') || '').toString(),
  details: (form.get('details') || '').toString(),
}));

el.syncNowBtn.onclick = () => persistStateNow();

el.changePasswordBtn.onclick = () => {
  el.passwordForm.reset();
  el.passwordMessage.textContent = '';
  el.passwordDialog.showModal();
};

el.passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(el.passwordForm);
  const current = (form.get('current') || '').toString();
  const next = (form.get('next') || '').toString();

  if (current !== state.password) {
    el.passwordMessage.textContent = 'Current password is incorrect.';
    return;
  }

  try {
    await apiPost('/api/password', { password: next });
    state.password = next;
    el.passwordMessage.textContent = 'Password updated for all devices.';
    setTimeout(() => el.passwordDialog.close(), 800);
  } catch {
    el.passwordMessage.textContent = 'Failed to update password.';
  }
});

(async function init() {
  await loadRemoteState();
  render();
  if (sessionStorage.getItem('vacation_planner_unlocked') !== 'true') {
    el.authOverlay.classList.remove('hidden');
  }
})();
