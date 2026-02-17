const searchInput = document.getElementById("country-search");
const resultsList = document.getElementById("results");
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

let countries = [];

function formatNumber(value) {
  return new Intl.NumberFormat("az-AZ").format(value ?? 0);
}

function listFromObject(obj, fallback = "Məlumat yoxdur") {
  if (!obj) return fallback;
  const values = Object.values(obj);
  return values.length ? values.join(", ") : fallback;
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

  items.slice(0, 25).forEach((country) => {
    const li = document.createElement("li");
    li.textContent = country.name.common;
    li.addEventListener("click", () => {
      searchInput.value = country.name.common;
      resultsList.innerHTML = "";
      showCountry(country);
    });
    resultsList.appendChild(li);
  });
}

async function loadCountries() {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,flags,capital,region,subregion,population,area,currencies,languages,idd,tld,timezones,borders,maps,startOfWeek,unMember"
    );
    const data = await response.json();

    const preferredExtras = ["Palestine", "Vatican City"];
    const core = data.filter((country) => country.unMember);
    const extras = data.filter((country) => preferredExtras.includes(country.name.common));

    countries = [...core, ...extras]
      .filter(
        (country, idx, arr) =>
          arr.findIndex((x) => x.name.common === country.name.common) === idx
      )
      .sort((a, b) => a.name.common.localeCompare(b.name.common));

    renderResults(countries);
  } catch (error) {
    resultsList.innerHTML = "<li>Məlumat yüklənmədi. İnternet bağlantısını yoxlayın.</li>";
  }
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

  const exact = filtered.find((country) => country.name.common.toLowerCase() === query);
  if (exact) showCountry(exact);
});

loadCountries();
