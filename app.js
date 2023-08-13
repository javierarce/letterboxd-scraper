const fs = require('fs')
const fetch = require('node-fetch')
const { parse } = require('node-html-parser')

const OUTPUT_FILE = 'films.json'

if (process.argv.length < 3) {
  console.error('Error: Please provide a username.')
  process.exit(1)
}

const USERNAME = process.argv[2]
const URL = `https://letterboxd.com/${USERNAME}/films/diary/page/`

async function fetchPage(pageNumber) {
  const response = await fetch(URL + pageNumber)
  const text = await response.text()
  return parse(text)
}

async function getTotalPages(root) {
  const pagination = root.querySelector('.paginate-pages')
  if (!pagination) return 1

  const lastPageLink = pagination.querySelectorAll('li a').pop()
  return lastPageLink ? parseInt(lastPageLink.innerText.trim(), 10) : 1
}

async function scrapeFilms() {
  const root = await fetchPage(1)
  const totalPages = await getTotalPages(root)
  const films = []

  for (let i = 1; i <= totalPages; i++) {
    const pageRoot = await fetchPage(i)
    const filmEntries = pageRoot.querySelectorAll('.diary-entry-row')

    filmEntries.forEach(entry => {
      const metadataElem = entry.querySelector('.edit-review-button')

      const watchedAt = metadataElem.getAttribute('data-viewing-date')
      const filmTitle = metadataElem.getAttribute('data-film-name')
      const rewatched = metadataElem.getAttribute('data-rewatch') === 'true'
      const year = metadataElem.getAttribute('data-film-year')
      const title = `${filmTitle} (${year})`
      const rating = parseInt(metadataElem.getAttribute('data-rating'), 10) / 2

      console.log(`${title} - ${rating} stars`)
      films.push({ watched_at: watchedAt, title, rating, rewatched })
    })
  }

  return films
}

scrapeFilms().then(films => {
  const updated_at = new Date().toISOString().split('T')[0] 
  const outputData = {
    updated_at,
    count: films.length,
    films
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2))

  console.log(`Total films: ${films.length}`)
}).catch(error => {
  console.error('Error scraping films:', error)
})
