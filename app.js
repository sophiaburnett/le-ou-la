const customEntries = {
  "espace": {
    article: "l'espace",
    gender: "Masculine",
    examples: [
      "L'espace est immense.",
      "Les astronautes voyagent dans l'espace."
    ],
    note: "Also: une espace = typographic space."
  }
};

const fallbackLexicon = {
  "table": ["feminine"],
  "chaise": ["feminine"],
  "maison": ["feminine"],
  "voiture": ["feminine"],
  "livre": ["masculine"],
  "problème": ["masculine"],
  "système": ["masculine"],
  "musée": ["masculine"],
  "arbre": ["masculine"],
  "courage": ["masculine"]
};

function normalise(input) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[’]/g, "'")
    .replace(/^(l'|le |la |les |un |une |des |du |de la |de l')/u, "")
    .trim();
}

function labelFromGenders(genders) {
  const unique = [...new Set(genders)];
  if (unique.includes("masculine") && unique.includes("feminine")) return "Masculine / Feminine";
  if (unique.includes("masculine")) return "Masculine";
  if (unique.includes("feminine")) return "Feminine";
  return "Not found";
}

function render(genders, microText = "") {
  result.classList.remove("hidden");
  answer.textContent = labelFromGenders(genders || []);
  micro.textContent = microText;
}

function renderCustomEntry(entry) {
  result.classList.remove("hidden");

  answer.innerHTML = `
    <div>${entry.article}</div>
    <div class="small-result">${entry.gender}</div>
  `;

  micro.innerHTML = `
    <div>${entry.examples[0]}</div>
    <div>${entry.examples[1]}</div>
    <br>
    <div>${entry.note}</div>
  `;
}

async function lookupGender(noun) {
  if (fallbackLexicon[noun]) {
    return { genders: fallbackLexicon[noun], source: "lexicon" };
  }

  return { genders: [], source: "" };
}

const form = document.querySelector("#gender-form");
const input = document.querySelector("#noun-input");
const result = document.querySelector("#result");
const answer = document.querySelector("#answer");
const micro = document.querySelector("#micro");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const noun = normalise(input.value);

  if (!noun) {
    render([], "Enter one French noun.");
    return;
  }

  if (customEntries[noun]) {
    renderCustomEntry(customEntries[noun]);
    return;
  }

  const { genders, source } = await lookupGender(noun);

  if (genders.length) {
    render(genders, source);
  } else {
    render([], "Not found");
  }
});
