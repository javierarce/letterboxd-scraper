const fs = require("fs");
const fetch = require("node-fetch");
const { parse } = require("node-html-parser");

const OUTPUT_FILE = "films.json";

if (process.argv.length < 3) {
  console.error("Error: Please provide a username.");
  process.exit(1);
}

const USERNAME = process.argv[2];
const URL = `https://letterboxd.com/${USERNAME}/films/diary/page/`;

async function fetchPage(pageNumber) {
  const response = await fetch(URL + pageNumber);
  const text = await response.text();
  return parse(text);
}

async function getTotalPages(root) {
  const pagination = root.querySelector(".paginate-pages");
  if (!pagination) return 1;
  const lastPageLink = pagination.querySelectorAll("li a").pop();
  return lastPageLink ? parseInt(lastPageLink.innerText.trim(), 10) : 1;
}

function parseRating(entry) {
  const ratingSpan = entry.querySelector(".td-rating .rating");
  if (!ratingSpan) return null;
  const match = ratingSpan.text.trim().match(/★{1,5}(½)?/);
  if (!match) return null;

  const stars = match[0];
  let rating = stars.split("★").length - 1;
  if (stars.includes("½")) rating += 0.5;
  return rating;
}

async function scrapeFilms() {
  const root = await fetchPage(1);
  const totalPages = await getTotalPages(root);
  const films = [];

  for (let i = 1; i <= totalPages; i++) {
    const pageRoot = await fetchPage(i);
    const filmEntries = pageRoot.querySelectorAll(".diary-entry-row");

    filmEntries.forEach((entry) => {
      const filmTitleEl = entry.querySelector(".td-film-details h2.name a");
      const yearEl = entry.querySelector(".td-released");
      const dateEl = entry.querySelector(".td-day a");
      const rating = parseRating(entry);

      const title = filmTitleEl?.text.trim() || "Untitled";
      const year = yearEl?.text.trim() || "Unknown";
      const watchedOn =
        dateEl?.getAttribute("href")?.split("/").filter(Boolean).pop() || null;

      const actions = entry.querySelector(".td-actions");
      const permalink = actions?.getAttribute("data-film-slug") || null;

      const rewatchIcon = entry.querySelector(".td-rewatch .icon-rewatch");
      const rewatched =
        rewatchIcon?.classList.contains("icon-status-on") || false;

      const film = {
        watched_on: watchedOn,
        title: `${title} (${year})`,
        rating,
        rewatched,
        permalink,
      };

      console.log(`${film.title} - ${film.rating ?? "no"} stars`);
      films.push(film);
    });
  }

  return films;
}

scrapeFilms()
  .then((films) => {
    const updated_at = new Date().toISOString().split("T")[0];
    const outputData = {
      updated_at,
      count: films.length,
      films,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`Total films: ${films.length}`);
  })
  .catch((error) => {
    console.error("Error scraping films:", error);
  });
