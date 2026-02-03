const STORAGE_KEYS = {
  feedbacks: "ra_feedbacks",
  companies: "ra_companies",
  people: "ra_people",
};

const state = {
  feedbacks: [],
  companies: [],
  people: [],
};

const selectors = {
  tabButtons: document.querySelectorAll(".tab-btn"),
  viewColeta: document.getElementById("view-coleta"),
  viewPainel: document.getElementById("view-painel"),
  feedbackForm: document.getElementById("feedback-form"),
  companySelect: document.getElementById("company-select"),
  personCompanySelect: document.getElementById("person-company"),
  feedbackList: document.getElementById("feedback-list"),
  searchInput: document.getElementById("search-input"),
  filterCompany: document.getElementById("filter-company"),
  filterType: document.getElementById("filter-type"),
  chartType: document.getElementById("chart-type"),
  chartCompany: document.getElementById("chart-company"),
  statFeedbacks: document.getElementById("stat-feedbacks"),
  statPeople: document.getElementById("stat-people"),
  statCompanies: document.getElementById("stat-companies"),
  metricToday: document.getElementById("metric-today"),
  metricAverage: document.getElementById("metric-average"),
  companyForm: document.getElementById("company-form"),
  companyList: document.getElementById("company-list"),
  personForm: document.getElementById("person-form"),
  personList: document.getElementById("person-list"),
};

const formatDate = (value) => new Date(value).toLocaleString("pt-BR");

const readStorage = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
};

const persistState = () => {
  localStorage.setItem(STORAGE_KEYS.feedbacks, JSON.stringify(state.feedbacks));
  localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(state.companies));
  localStorage.setItem(STORAGE_KEYS.people, JSON.stringify(state.people));
};

const loadState = () => {
  state.feedbacks = readStorage(STORAGE_KEYS.feedbacks, []);
  state.companies = readStorage(STORAGE_KEYS.companies, [
    { id: crypto.randomUUID(), name: "Unidade Centro" },
    { id: crypto.randomUUID(), name: "Unidade Zona Sul" },
  ]);
  state.people = readStorage(STORAGE_KEYS.people, []);
};

const setActiveTab = (target) => {
  const isColeta = target === "coleta";
  selectors.viewColeta.classList.toggle("hidden", !isColeta);
  selectors.viewPainel.classList.toggle("hidden", isColeta);

  selectors.tabButtons.forEach((button) => {
    const active = button.dataset.tab === target;
    button.classList.toggle("border-emerald-400/60", active);
    button.classList.toggle("bg-emerald-500/20", active);
    button.classList.toggle("text-emerald-200", active);
    button.classList.toggle("border-slate-700/60", !active);
    button.classList.toggle("bg-slate-900/60", !active);
    button.classList.toggle("text-slate-200", !active);
  });
};

const renderCompanyOptions = () => {
  const options = state.companies
    .map((company) => `<option value="${company.id}">${company.name}</option>`)
    .join("");

  selectors.companySelect.innerHTML = options;
  selectors.personCompanySelect.innerHTML = options;
  selectors.filterCompany.innerHTML = `<option value="">Todas empresas</option>${options}`;
};

const renderFeedbacks = () => {
  const search = selectors.searchInput.value.trim().toLowerCase();
  const companyFilter = selectors.filterCompany.value;
  const typeFilter = selectors.filterType.value;

  const filtered = state.feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.name.toLowerCase().includes(search) ||
      feedback.message.toLowerCase().includes(search);
    const matchesCompany = !companyFilter || feedback.companyId === companyFilter;
    const matchesType = !typeFilter || feedback.personType === typeFilter;
    return matchesSearch && matchesCompany && matchesType;
  });

  selectors.feedbackList.innerHTML = filtered
    .map((feedback) => {
      const company = state.companies.find((item) => item.id === feedback.companyId);
      return `
        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-white">${feedback.name}</p>
              <p class="text-xs text-slate-400">${company ? company.name : "Empresa não encontrada"}</p>
            </div>
            <span class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-wider text-emerald-200">
              ${feedback.personType}
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-200">${feedback.message}</p>
          <div class="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>${feedback.email || "Email não informado"}</span>
            <span>${feedback.phone || "Telefone não informado"}</span>
            <span>${formatDate(feedback.createdAt)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  if (!filtered.length) {
    selectors.feedbackList.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        Nenhum feedback encontrado para os filtros atuais.
      </div>
    `;
  }
};

const renderStats = () => {
  selectors.statFeedbacks.textContent = state.feedbacks.length;
  selectors.statPeople.textContent = state.people.length;
  selectors.statCompanies.textContent = state.companies.length;

  const today = new Date().toDateString();
  const todayCount = state.feedbacks.filter(
    (feedback) => new Date(feedback.createdAt).toDateString() === today,
  ).length;
  selectors.metricToday.textContent = todayCount;

  const average = state.companies.length
    ? Math.round(state.feedbacks.length / state.companies.length)
    : 0;
  selectors.metricAverage.textContent = average;
};

const renderCharts = () => {
  const typeCounts = state.feedbacks.reduce(
    (acc, feedback) => {
      acc[feedback.personType] = (acc[feedback.personType] || 0) + 1;
      return acc;
    },
    { cliente: 0, funcionario: 0 },
  );

  const maxType = Math.max(typeCounts.cliente, typeCounts.funcionario, 1);
  selectors.chartType.innerHTML = Object.entries(typeCounts)
    .map(([key, value]) => {
      const percent = Math.round((value / maxType) * 100);
      return `
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span class="uppercase">${key}</span>
            <span>${value}</span>
          </div>
          <div class="mt-2 h-2 w-full rounded-full bg-slate-800">
            <div class="h-2 rounded-full bg-emerald-400" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const companyCounts = state.companies.map((company) => {
    const count = state.feedbacks.filter((feedback) => feedback.companyId === company.id).length;
    return { name: company.name, count };
  });
  const maxCompany = Math.max(...companyCounts.map((item) => item.count), 1);

  selectors.chartCompany.innerHTML = companyCounts
    .map((company) => {
      const percent = Math.round((company.count / maxCompany) * 100);
      return `
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>${company.name}</span>
            <span>${company.count}</span>
          </div>
          <div class="mt-2 h-2 w-full rounded-full bg-slate-800">
            <div class="h-2 rounded-full bg-sky-400" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
};

const renderCompanyList = () => {
  selectors.companyList.innerHTML = state.companies
    .map((company) => `<li class="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2">${company.name}</li>`)
    .join("");
};

const renderPeopleList = () => {
  selectors.personList.innerHTML = state.people
    .map(
      (person) => `
        <li class="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2">
          <div class="flex items-center justify-between">
            <span class="font-medium text-white">${person.name}</span>
            <span class="text-xs uppercase text-emerald-200">${person.role}</span>
          </div>
          <p class="text-xs text-slate-400">${person.companyName}</p>
          <p class="text-xs text-slate-500">${person.contact || "Sem contato"}</p>
        </li>
      `,
    )
    .join("");
};

const handleFeedbackSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const entry = {
    id: crypto.randomUUID(),
    name: formData.get("name").trim(),
    personType: formData.get("personType"),
    companyId: formData.get("company"),
    phone: formData.get("phone").trim(),
    email: formData.get("email").trim(),
    message: formData.get("message").trim(),
    createdAt: new Date().toISOString(),
  };

  state.feedbacks.unshift(entry);
  persistState();
  renderAll();
  event.target.reset();
};

const handleCompanySubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const name = formData.get("companyName").trim();
  if (!name) return;

  state.companies.push({ id: crypto.randomUUID(), name });
  persistState();
  renderAll();
  event.target.reset();
};

const handlePersonSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const companyId = formData.get("personCompany");
  const company = state.companies.find((item) => item.id === companyId);
  state.people.unshift({
    id: crypto.randomUUID(),
    name: formData.get("personName").trim(),
    role: formData.get("personRole"),
    companyId,
    companyName: company ? company.name : "Empresa não encontrada",
    contact: formData.get("personContact").trim(),
    createdAt: new Date().toISOString(),
  });
  persistState();
  renderAll();
  event.target.reset();
};

const renderAll = () => {
  renderCompanyOptions();
  renderFeedbacks();
  renderStats();
  renderCharts();
  renderCompanyList();
  renderPeopleList();
};

selectors.tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

selectors.feedbackForm.addEventListener("submit", handleFeedbackSubmit);
selectors.companyForm.addEventListener("submit", handleCompanySubmit);
selectors.personForm.addEventListener("submit", handlePersonSubmit);
selectors.searchInput.addEventListener("input", renderFeedbacks);
selectors.filterCompany.addEventListener("change", renderFeedbacks);
selectors.filterType.addEventListener("change", renderFeedbacks);

loadState();
renderAll();
setActiveTab("coleta");
