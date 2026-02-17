const searchInput = document.getElementById("country-search");
const resultsList = document.getElementById("results");
const statusLabel = document.getElementById("status");
const card = document.getElementById("country-card");

const fields = {
  flag: document.getElementById("flag"),
  name: document.getElementById("name"),
  official: document.getElementById("official"),
  capital: document.getElementById("capital"),
  region: document.getElementById("region"),
  subregion: document.getElementById("subregion"),
  population: document.getElementById("population"),
  area: document.getElementById("area"),
  currency: document.getElementById("currency"),
  languages: document.getElementById("languages"),
  calling: document.getElementById("calling"),
  domain: document.getElementById("domain"),
  timezone: document.getElementById("timezone"),
  borders: document.getElementById("borders"),
  week: document.getElementById("week"),
  maps: document.getElementById("maps"),
};

const ENDPOINTS = [
  "https://restcountries.com/v3.1/all",
  "https://restcountries.francocarballar.com/api/v1/all",
];

let countries = [];

function formatNumber(value) {
  return new Intl.NumberFormat("az-AZ").format(value ?? 0);
}

function listFromObject(obj, fallback = "Məlumat yoxdur") {
  if (!obj) return fallback;
  const values = Object.values(obj);
  return values.length ? values.join(", ") : fallback;
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeData(raw) {
  const rows = Array.isArray(raw) ? raw : raw?.data || [];
  const preferredExtras = ["Palestine", "Vatican City"];
  const core = rows.filter((country) => country.unMember);
  const extras = rows.filter((country) => preferredExtras.includes(country?.name?.common));

  return [...core, ...extras]
    .filter((country) => country?.name?.common)
    .filter(
      (country, idx, arr) => arr.findIndex((x) => x.name.common === country.name.common) === idx
    )
    .sort((a, b) => a.name.common.localeCompare(b.name.common));
}

function showCountry(country) {
  fields.flag.src = country.flags?.svg || country.flags?.png || "";
  fields.flag.alt = `${country.name.common} bayrağı`;
  fields.name.textContent = country.name.common;
  fields.official.textContent = country.name.official;
  fields.capital.textContent = country.capital?.join(", ") || "Məlumat yoxdur";
  fields.region.textContent = country.region || "Məlumat yoxdur";
  fields.subregion.textContent = country.subregion || "Məlumat yoxdur";
  fields.population.textContent = `${formatNumber(country.population)} nəfər`;
  fields.area.textContent = `${formatNumber(country.area)} km²`;
  fields.currency.textContent = listFromObject(
    country.currencies
      ? Object.fromEntries(
          Object.values(country.currencies).map((c) => [c.name, `${c.name} (${c.symbol || "-"})`])
        )
      : null
  );
  fields.languages.textContent = listFromObject(country.languages);
  fields.calling.textContent = country.idd?.root
    ? `${country.idd.root}${country.idd.suffixes?.[0] || ""}`
    : "Məlumat yoxdur";
  fields.domain.textContent = country.tld?.join(", ") || "Məlumat yoxdur";
  fields.timezone.textContent = country.timezones?.join(", ") || "Məlumat yoxdur";
  fields.borders.textContent = country.borders?.join(", ") || "Ada ölkəsi / məlumat yoxdur";
  fields.week.textContent = country.startOfWeek || "Məlumat yoxdur";
  fields.maps.href = country.maps?.googleMaps || "#";

  card.classList.remove("hidden");
}

function renderResults(items) {
  resultsList.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "Nəticə tapılmadı";
    li.style.opacity = "0.7";
    li.style.cursor = "default";
    resultsList.appendChild(li);
    return;
  }

  items.slice(0, 30).forEach((country, index) => {
    const li = document.createElement("li");
    li.textContent = country.name.common;
    if (index === 0) li.classList.add("active");
    li.addEventListener("click", () => {
      searchInput.value = country.name.common;
      showCountry(country);
    });
    resultsList.appendChild(li);
  });
}

async function loadCountries() {
  statusLabel.textContent = "Məlumatlar yüklənir...";

  for (const endpoint of ENDPOINTS) {
    try {
      const query =
        endpoint.includes("restcountries.com")
          ? `${endpoint}?fields=name,flags,capital,region,subregion,population,area,currencies,languages,idd,tld,timezones,borders,maps,startOfWeek,unMember`
          : endpoint;
      const data = await fetchWithTimeout(query);
      countries = normalizeData(data);
      if (!countries.length) throw new Error("Boş nəticə");

      renderResults(countries);
      statusLabel.textContent = `${countries.length} ölkə yükləndi.`;
      return;
    } catch (error) {
      statusLabel.textContent = `Bağlantı alınmadı, alternativ server yoxlanır...`;
    }
  }

  statusLabel.textContent =
    "Serverə qoşulma alınmadı. Saytı internetlə açın və yeniləyin (F5).";
  resultsList.innerHTML = "";
}

searchInput.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();

  if (!query) {
    card.classList.add("hidden");
    renderResults(countries);
    return;
  }

  const filtered = countries.filter((country) =>
    [country.name.common, country.name.official].some((name) =>
      name.toLowerCase().includes(query)
    )
  );

  renderResults(filtered);
  if (filtered[0]) showCountry(filtered[0]);
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const top = countries.find((country) =>
    country.name.common.toLowerCase().includes(searchInput.value.trim().toLowerCase())
  );
  if (top) showCountry(top);
});

loadCountries();
