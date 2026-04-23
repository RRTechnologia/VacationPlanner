const STORAGE_KEY = "vacation_planner_data_v1";
const PASSWORD_KEY = "vacation_planner_password";

const state = {
  vacations: [],
  selectedId: null,
};

const el = {
  authOverlay: document.getElementById("authOverlay"),
  unlockForm: document.getElementById("unlockForm"),
  passwordInput: document.getElementById("passwordInput"),
  authError: document.getElementById("authError"),
  vacationList: document.getElementById("vacationList"),
  vacationForm: document.getElementById("vacationForm"),
  plannerPane: document.getElementById("plannerPane"),
  emptyState: document.getElementById("emptyState"),
  vacationTitle: document.getElementById("vacationTitle"),
  vacationMetaForm: document.getElementById("vacationMetaForm"),
  deleteVacationBtn: document.getElementById("deleteVacationBtn"),
  placeForm: document.getElementById("placeForm"),
  placeList: document.getElementById("placeList"),
  expenseForm: document.getElementById("expenseForm"),
  expenseList: document.getElementById("expenseList"),
  budgetSummary: document.getElementById("budgetSummary"),
  todoForm: document.getElementById("todoForm"),
  todoList: document.getElementById("todoList"),
  bookingForm: document.getElementById("bookingForm"),
  bookingList: document.getElementById("bookingList"),
  packingForm: document.getElementById("packingForm"),
  packingList: document.getElementById("packingList"),
  contactForm: document.getElementById("contactForm"),
  contactList: document.getElementById("contactList"),
  changePasswordBtn: document.getElementById("changePasswordBtn"),
  passwordDialog: document.getElementById("passwordDialog"),
  passwordForm: document.getElementById("passwordForm"),
  passwordMessage: document.getElementById("passwordMessage"),
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPassword() {
  const saved = localStorage.getItem(PASSWORD_KEY);
  if (!saved) {
    localStorage.setItem(PASSWORD_KEY, "1234");
    return "1234";
  }
  return saved;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.vacations = Array.isArray(parsed.vacations) ? parsed.vacations : [];
    state.selectedId = parsed.selectedId || state.vacations[0]?.id || null;
  } catch {
    state.vacations = [];
    state.selectedId = null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function selectedVacation() {
  return state.vacations.find((v) => v.id === state.selectedId) || null;
}

function formatMoney(amount, currency = "USD") {
  if (Number.isNaN(amount)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function renderVacations() {
  el.vacationList.innerHTML = "";
  state.vacations.forEach((vacation) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = `vacation-btn ${vacation.id === state.selectedId ? "active" : ""}`;
    btn.textContent = `${vacation.name} • ${vacation.destination}`;
    btn.onclick = () => {
      state.selectedId = vacation.id;
      saveState();
      render();
    };
    li.appendChild(btn);
    el.vacationList.appendChild(li);
  });
}

function createItemLi(title, details = [], onDelete, done = null) {
  const li = document.createElement("li");
  const top = document.createElement("div");
  top.className = "item-top";

  const strong = document.createElement("strong");
  strong.textContent = title;
  top.appendChild(strong);

  const actions = document.createElement("div");
  if (done !== null) {
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = done;
    check.onchange = () => done.handler(check.checked);
    actions.appendChild(check);
  }
  const del = document.createElement("button");
  del.textContent = "Delete";
  del.className = "secondary";
  del.onclick = onDelete;
  actions.appendChild(del);

  top.appendChild(actions);
  li.appendChild(top);

  details.forEach((line) => {
    if (!line) return;
    const small = document.createElement("small");
    if (line.type === "link") {
      const a = document.createElement("a");
      a.href = line.value;
      a.textContent = line.value;
      a.target = "_blank";
      a.rel = "noreferrer";
      small.appendChild(a);
    } else {
      small.textContent = line;
    }
    li.appendChild(small);
  });

  return li;
}

function mutateSelected(mutator) {
  const v = selectedVacation();
  if (!v) return;
  mutator(v);
  saveState();
  render();
}

function renderSelected() {
  const vacation = selectedVacation();
  if (!vacation) {
    el.plannerPane.classList.add("hidden");
    el.emptyState.classList.remove("hidden");
    return;
  }

  el.plannerPane.classList.remove("hidden");
  el.emptyState.classList.add("hidden");
  el.vacationTitle.textContent = vacation.name;

  Object.entries({
    destination: vacation.destination,
    travelers: vacation.travelers || "",
    startDate: vacation.startDate,
    endDate: vacation.endDate,
    budget: vacation.budget,
    currency: vacation.currency || "USD",
    notes: vacation.notes || "",
  }).forEach(([k, v]) => {
    el.vacationMetaForm.elements[k].value = v ?? "";
  });

  el.placeList.innerHTML = "";
  vacation.places.forEach((place) => {
    const li = createItemLi(
      place.name,
      [
        place.address && `Address: ${place.address}`,
        place.bestTime && `Best time: ${place.bestTime}`,
        place.estimatedCost ? `Cost: ${formatMoney(Number(place.estimatedCost), vacation.currency)}` : "",
        place.todo && `Todo: ${place.todo}`,
        place.notes && `Notes: ${place.notes}`,
        place.mapLink ? { type: "link", value: place.mapLink } : "",
      ],
      () => mutateSelected((x) => (x.places = x.places.filter((p) => p.id !== place.id)))
    );
    el.placeList.appendChild(li);
  });

  const planned = vacation.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const left = Number(vacation.budget || 0) - planned;
  el.budgetSummary.textContent = `Planned: ${formatMoney(planned, vacation.currency)} | Remaining: ${formatMoney(left, vacation.currency)}`;
  el.expenseList.innerHTML = "";
  vacation.expenses.forEach((expense) => {
    const li = createItemLi(
      `${expense.label} — ${formatMoney(Number(expense.amount), vacation.currency)}`,
      [expense.category && `Category: ${expense.category}`, expense.paidBy && `Paid by: ${expense.paidBy}`],
      () => mutateSelected((x) => (x.expenses = x.expenses.filter((e) => e.id !== expense.id)))
    );
    el.expenseList.appendChild(li);
  });

  el.todoList.innerHTML = "";
  vacation.todos.forEach((todo) => {
    const li = createItemLi(
      todo.done ? `✅ ${todo.task}` : todo.task,
      [todo.dueDate && `Due: ${todo.dueDate}`, `Priority: ${todo.priority}`],
      () => mutateSelected((x) => (x.todos = x.todos.filter((t) => t.id !== todo.id))),
      {
        handler: (checked) => mutateSelected((x) => {
          const t = x.todos.find((i) => i.id === todo.id);
          if (t) t.done = checked;
        }),
      }
    );
    el.todoList.appendChild(li);
  });

  el.bookingList.innerHTML = "";
  vacation.bookings.forEach((booking) => {
    const li = createItemLi(
      `${booking.type}${booking.provider ? ` • ${booking.provider}` : ""}`,
      [booking.confirmation && `Confirmation: ${booking.confirmation}`, booking.link ? { type: "link", value: booking.link } : ""],
      () => mutateSelected((x) => (x.bookings = x.bookings.filter((b) => b.id !== booking.id)))
    );
    el.bookingList.appendChild(li);
  });

  el.packingList.innerHTML = "";
  vacation.packing.forEach((item) => {
    const li = createItemLi(
      item.done ? `✅ ${item.item}` : item.item,
      [],
      () => mutateSelected((x) => (x.packing = x.packing.filter((p) => p.id !== item.id))),
      {
        handler: (checked) => mutateSelected((x) => {
          const i = x.packing.find((p) => p.id === item.id);
          if (i) i.done = checked;
        }),
      }
    );
    el.packingList.appendChild(li);
  });

  el.contactList.innerHTML = "";
  vacation.contacts.forEach((contact) => {
    const li = createItemLi(
      contact.name,
      [contact.phone && `Phone: ${contact.phone}`, contact.details && `Details: ${contact.details}`],
      () => mutateSelected((x) => (x.contacts = x.contacts.filter((c) => c.id !== contact.id)))
    );
    el.contactList.appendChild(li);
  });
}

function render() {
  renderVacations();
  renderSelected();
}

el.unlockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (el.passwordInput.value === getPassword()) {
    sessionStorage.setItem("vacation_planner_unlocked", "true");
    el.authOverlay.classList.add("hidden");
    el.authError.classList.add("hidden");
    el.passwordInput.value = "";
  } else {
    el.authError.classList.remove("hidden");
  }
});

el.vacationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(el.vacationForm);
  const vacation = {
    id: uid(),
    name: form.get("name")?.toString().trim(),
    destination: form.get("destination")?.toString().trim(),
    startDate: form.get("startDate") || "",
    endDate: form.get("endDate") || "",
    budget: Number(form.get("budget") || 0),
    currency: (form.get("currency") || "USD").toString().toUpperCase(),
    travelers: "",
    notes: "",
    places: [],
    expenses: [],
    todos: [],
    bookings: [],
    packing: [],
    contacts: [],
  };
  state.vacations.unshift(vacation);
  state.selectedId = vacation.id;
  el.vacationForm.reset();
  el.vacationForm.elements.currency.value = "USD";
  saveState();
  render();
});

el.vacationMetaForm.addEventListener("submit", (e) => {
  e.preventDefault();
  mutateSelected((v) => {
    const form = new FormData(el.vacationMetaForm);
    v.destination = (form.get("destination") || "").toString();
    v.travelers = (form.get("travelers") || "").toString();
    v.startDate = (form.get("startDate") || "").toString();
    v.endDate = (form.get("endDate") || "").toString();
    v.budget = Number(form.get("budget") || 0);
    v.currency = (form.get("currency") || "USD").toString().toUpperCase();
    v.notes = (form.get("notes") || "").toString();
  });
});

el.deleteVacationBtn.onclick = () => {
  const v = selectedVacation();
  if (!v) return;
  if (!window.confirm(`Delete vacation "${v.name}"?`)) return;
  state.vacations = state.vacations.filter((x) => x.id !== v.id);
  state.selectedId = state.vacations[0]?.id || null;
  saveState();
  render();
};

function bindSimpleAdd(formEl, arrayKey, mapper) {
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(formEl);
    mutateSelected((v) => v[arrayKey].unshift({ id: uid(), ...mapper(form) }));
    formEl.reset();
  });
}

bindSimpleAdd(el.placeForm, "places", (f) => ({
  name: (f.get("name") || "").toString(),
  address: (f.get("address") || "").toString(),
  mapLink: (f.get("mapLink") || "").toString(),
  estimatedCost: Number(f.get("estimatedCost") || 0),
  bestTime: (f.get("bestTime") || "").toString(),
  todo: (f.get("todo") || "").toString(),
  notes: (f.get("notes") || "").toString(),
}));

bindSimpleAdd(el.expenseForm, "expenses", (f) => ({
  label: (f.get("label") || "").toString(),
  category: (f.get("category") || "").toString(),
  amount: Number(f.get("amount") || 0),
  paidBy: (f.get("paidBy") || "").toString(),
}));

bindSimpleAdd(el.todoForm, "todos", (f) => ({
  task: (f.get("task") || "").toString(),
  dueDate: (f.get("dueDate") || "").toString(),
  priority: (f.get("priority") || "Medium").toString(),
  done: false,
}));

bindSimpleAdd(el.bookingForm, "bookings", (f) => ({
  type: (f.get("type") || "").toString(),
  provider: (f.get("provider") || "").toString(),
  confirmation: (f.get("confirmation") || "").toString(),
  link: (f.get("link") || "").toString(),
}));

bindSimpleAdd(el.packingForm, "packing", (f) => ({
  item: (f.get("item") || "").toString(),
  done: false,
}));

bindSimpleAdd(el.contactForm, "contacts", (f) => ({
  name: (f.get("name") || "").toString(),
  phone: (f.get("phone") || "").toString(),
  details: (f.get("details") || "").toString(),
}));

el.changePasswordBtn.onclick = () => {
  el.passwordMessage.textContent = "";
  el.passwordForm.reset();
  el.passwordDialog.showModal();
};

el.passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(el.passwordForm);
  const current = (data.get("current") || "").toString();
  const next = (data.get("next") || "").toString();
  if (current !== getPassword()) {
    el.passwordMessage.textContent = "Current password is incorrect.";
    return;
  }
  localStorage.setItem(PASSWORD_KEY, next);
  el.passwordMessage.textContent = "Password updated.";
  setTimeout(() => el.passwordDialog.close(), 650);
});

loadState();
render();
if (sessionStorage.getItem("vacation_planner_unlocked") !== "true") {
  el.authOverlay.classList.remove("hidden");
} else {
  el.authOverlay.classList.add("hidden");
}
