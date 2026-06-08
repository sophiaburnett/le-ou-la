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
  // Common words included so the app still works if the dictionary API is blocked.
  "table": ["feminine"],
  "chaise": ["feminine"],
  "maison": ["feminine"],
  "voiture": ["feminine"],
  "porte": ["feminine"],
  "fenêtre": ["feminine"],
  "fleur": ["feminine"],
  "mer": ["feminine"],
  "eau": ["feminine"],
  "nuit": ["feminine"],
  "main": ["feminine"],
  "voix": ["feminine"],
  "peau": ["feminine"],
  "fois": ["feminine"],
  "paix": ["feminine"],
  "ville": ["feminine"],
  "langue": ["feminine"],
  "question": ["feminine"],
  "solution": ["feminine"],
  "liberté": ["feminine"],
  "personne": ["feminine"],
  "image": ["feminine"],
  "idée": ["feminine"],
  "histoire": ["feminine"],

  "livre": ["masculine"],
  "stylo": ["masculine"],
  "chien": ["masculine"],
  "chat": ["masculine"],
  "garçon": ["masculine"],
  "homme": ["masculine"],
  "monde": ["masculine"],
  "problème": ["masculine"],
  "système": ["masculine"],
  "thème": ["masculine"],
  "musée": ["masculine"],
  "arbre": ["masculine"],
  "avion": ["masculine"],
  "bras": ["masculine"],
  "café": ["masculine"],
  "fromage": ["masculine"],
  "courage": ["masculine"],
  "village": ["masculine"],
  "travail": ["masculine"],
  "amour": ["masculine"]
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
  const unique = [...new Set(genders)].sort();

  if (unique.includes("masculine") && unique.includes("feminine")) {
    return "Masculine / Feminine";
  }

  if (unique.includes("masculine")) return "Masculine";
  if (unique.includes("feminine")) return "Feminine";

  return "Not found";
}

function render(genders, microText = "") {
  result.classList.remove("hidden");
  answer.textContent = labelFromGenders(genders || []);
  micro.textContent = microText;
}

function extractFrenchSection(wikitext) {
  const start = wikitext.search(/^==\s*French\s*==\s*$/m);
  if (start === -1) return "";

  const afterStart = wikitext.slice(start);
  const nextLanguage = afterStart.slice(1).search(/\n==[^=]+==\s*$/m);

  return nextLanguage === -1 ? afterStart : afterStart.slice(0, nextLanguage + 1);
}

function extractNounSections(frenchSection) {
  const headings = [...frenchSection.matchAll(/^={3,}\s*Noun\s*={3,}\s*$/gmi)];

  if (!headings.length) return [];

  return headings.map((heading, index) => {
    const start = heading.index;
    const next = headings[index + 1]?.index ?? frenchSection.length;
    return frenchSection.slice(start, next);
  });
}

function gendersFromTemplates(text) {
  const genders = new Set();

  const templateBits = [
    ...text.matchAll(/\{\{fr-noun\|([^}\n]+)/gi),
    ...text.matchAll(/\{\{head\|fr\|noun\|([^}\n]+)/gi)
  ].map(match => match[1]);

  for (const bit of templateBits) {
    const fields = bit.split("|").map(x => x.trim());

    for (const field of fields) {
      if (field === "m" || field === "m-p" || field === "g=m" || field === "g2=m") {
        genders.add("masculine");
      }
      if (field === "f" || field === "f-p" || field === "g=f" || field === "g2=f") {
        genders.add("feminine");
      }
      if (field === "mf" || field === "mfbysense" || field === "g=mf") {
        genders.add("masculine");
        genders.add("feminine");
      }
    }
  }

  // Catch rendered-style labels occasionally present in page text.
  if (/\{\{m\}\}|\bgender\s*=\s*masculine\b|\bmasculine\b/i.test(text.slice(0, 1800))) {
    genders.add("masculine");
  }
  if (/\{\{f\}\}|\bgender\s*=\s*feminine\b|\bfeminine\b/i.test(text.slice(0, 1800))) {
    genders.add("feminine");
  }

  return [...genders];
}

if (customEntries[noun]) {
  const entry = customEntries[noun];

  answer.innerHTML = `
    <div>${entry.article}</div>
    <div>${entry.gender}</div>
    <br>
    <div>${entry.examples[0]}</div>
    <div>${entry.examples[1]}</div>
  `;

  result.classList.remove("hidden");
  return;
}

async function lookupEnglishWiktionary(noun) {
  const url = "https://en.wiktionary.org/w/api.php?" + new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: noun,
    rvslots: "main",
    rvprop: "content",
    format: "json",
    origin: "*"
  });

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  const page = Object.values(data?.query?.pages || {})[0];

  if (!page || page.missing) return [];

  const wikitext = page.revisions?.[0]?.slots?.main?.["*"];
  if (!wikitext) return [];

  const frenchSection = extractFrenchSection(wikitext);
  const nounSections = extractNounSections(frenchSection);

  if (!nounSections.length) return [];

  return [...new Set(nounSections.flatMap(gendersFromTemplates))];
}

async function lookupFrenchWiktionary(noun) {
  const url = "https://fr.wiktionary.org/w/api.php?" + new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: noun,
    rvslots: "main",
    rvprop: "content",
    format: "json",
    origin: "*"
  });

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  const page = Object.values(data?.query?.pages || {})[0];

  if (!page || page.missing) return [];

  const wikitext = page.revisions?.[0]?.slots?.main?.["*"];
  if (!wikitext) return [];

  const genders = new Set();

  // French Wiktionary often uses templates like {{fr-rég|tabl|f}} or {{S|nom|fr}} sections.
  const frenchNomSections = wikitext.split(/\n(?=\{\{S\|nom\|fr)/i).filter(part => /^\{\{S\|nom\|fr/i.test(part));

  for (const section of frenchNomSections.length ? frenchNomSections : [wikitext.slice(0, 2500)]) {
    if (/\{\{fr-[^}]*\|[^}]*\|m(?:\||\})/i.test(section) || /\{\{m\}\}/i.test(section) || /\bmasculin\b/i.test(section.slice(0, 1200))) {
      genders.add("masculine");
    }
    if (/\{\{fr-[^}]*\|[^}]*\|f(?:\||\})/i.test(section) || /\{\{f\}\}/i.test(section) || /\bféminin\b/i.test(section.slice(0, 1200))) {
      genders.add("feminine");
    }
  }

  return [...genders];
}

async function lookupGender(noun) {
  // 1. Built-in safety net.
  if (fallbackLexicon[noun]) {
    return { genders: fallbackLexicon[noun], source: "lexicon" };
  }

  // 2. English Wiktionary is usually easiest to parse.
  let genders = await lookupEnglishWiktionary(noun);
  if (genders.length) {
    return { genders, source: "Wiktionary" };
  }

  // 3. French Wiktionary backup.
  genders = await lookupFrenchWiktionary(noun);
  if (genders.length) {
    return { genders, source: "Wiktionnaire" };
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

  if (noun.includes(" ")) {
    render([], "One noun only.");
    return;
  }

  render([], "Checking…");

  try {
    const { genders, source } = await lookupGender(noun);

    if (genders.length) {
      render(genders, source);
    } else {
      render([], "Not found");
    }
  } catch (error) {
    console.error(error);
    render([], "Dictionary lookup failed");
  }
});
