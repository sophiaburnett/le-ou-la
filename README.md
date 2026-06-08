# French Noun Gender — v3 08/06/2026

A simple browser app for checking the grammatical gender of a French noun. Made by Sophia Burnett, who despite being fluent, has often second-guessed herself when presented with an uncountable noun or an abstract noun. There are general principles such as -age endings being masculine and -tion endings being feminine, but sometimes it's unclear.

## What changed in v3

- Restores the stronger visual design from v1.
- Removes blurbs, explanations, and confidence ratings.
- Uses lexical lookup:
  1. small built-in safety lexicon,
  2. English Wiktionary API (why is unclear)
  3. French Wiktionnaire API (vital for function)

## How to run

Open `index.html` in a browser.

The online dictionary lookup requires an internet connection. Some browsers may restrict API requests from local files; if that happens, run a tiny local server:

```bash
python -m http.server
```

Then open:

```text
http://localhost:8000
```
