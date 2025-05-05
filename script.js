let pages = [];

fetch('pages.json')
  .then(res => res.json())
  .then(data => {
    pages = data;
    console.log("Geladene Seiten:", pages);
  })
  .catch(error => console.error("Fehler beim Laden von pages.json:", error));

// 🔍 Suchfunktion
function search() {
  const query = document.getElementById('searchBox').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!query) return;

  const results = pages
    .map(page => {
      const titleMatch = page.title.toLowerCase().includes(query);
      const contentMatch = page.content.toLowerCase().includes(query);
      const urlMatch = page.url.toLowerCase().includes(query);
      const tagMatches = page.tags && Array.isArray(page.tags)
        ? page.tags.filter(tag => tag.toLowerCase().includes(query))
        : [];

      if (!titleMatch && !contentMatch && !urlMatch && tagMatches.length === 0) return null;

      let score = 0;
      if (titleMatch) score += 10;
      if (contentMatch) score += 5;
      if (urlMatch) score += 15;
      if (tagMatches.length > 0) score += tagMatches.length * 8;

      score += getURLScore(page.url);

      return { ...page, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>Keine Ergebnisse gefunden.</p>';
    return;
  }

  results.forEach(page => {
    const resultContainer = document.createElement('div');
    resultContainer.classList.add('result-item');
    resultContainer.style.border = '1px solid #ccc';
    resultContainer.style.borderRadius = '8px';
    resultContainer.style.padding = '10px';
    resultContainer.style.marginBottom = '15px';
    resultContainer.style.display = 'flex';
    resultContainer.style.flexDirection = 'column';
    resultContainer.style.gap = '8px';

    if (document.body.classList.contains('darkmode')) {
      resultContainer.style.backgroundColor = '#333';
      resultContainer.style.color = '#fff';
      resultContainer.style.borderColor = '#555';
    } else {
      resultContainer.style.backgroundColor = '#f9f9f9';
      resultContainer.style.color = '#333';
      resultContainer.style.borderColor = '#ccc';
    }

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '10px';

    let faviconUrl = page.url;
    if (!faviconUrl.endsWith('/')) {
      faviconUrl += '/';
    }
    faviconUrl += 'favicon.ico';

    const faviconImg = document.createElement('img');
    faviconImg.src = faviconUrl;
    faviconImg.alt = 'Favicon';
    faviconImg.style.width = '24px';
    faviconImg.style.height = '24px';
    faviconImg.onerror = function () {
      this.remove();
    };

    const link = document.createElement('a');
    link.href = page.url;
    link.target = '_self';
    link.innerHTML = highlight(page.title, query);
    link.style.fontSize = '18px';
    link.style.fontWeight = 'bold';
    link.style.textDecoration = 'none';
    link.style.color = '#007bff';

    const urlDisplay = document.createElement('a');
    urlDisplay.href = page.url;
    urlDisplay.textContent = page.url;
    urlDisplay.target = '_self';
    urlDisplay.style.fontSize = '16px';
    urlDisplay.style.textDecoration = 'none';
    urlDisplay.style.marginTop = '5px';
    urlDisplay.style.wordBreak = 'break-all';

    if (document.body.classList.contains('darkmode')) {
      urlDisplay.style.color = '#00d9ff';
    } else {
      urlDisplay.style.color = '#555';
    }

    urlDisplay.addEventListener('mouseover', () => {
      urlDisplay.style.textDecoration = 'underline';
    });
    urlDisplay.addEventListener('mouseout', () => {
      urlDisplay.style.textDecoration = 'none';
    });

    header.appendChild(faviconImg);
    header.appendChild(link);
    resultContainer.appendChild(header);
    resultContainer.appendChild(urlDisplay);

    const snippet = document.createElement('p');
    snippet.innerHTML = highlightSnippet(page.content, query);
    snippet.style.margin = '0';
    snippet.style.color = document.body.classList.contains('darkmode') ? '#333' : '#333';
    resultContainer.appendChild(snippet);

    resultsDiv.appendChild(resultContainer);
  });
}

// 🧠 Bewertet URL-Nähe zur Startseite
function getURLScore(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const depth = path.split('/').filter(Boolean).length;
    const lengthScore = Math.max(0, 50 - url.length / 4);
    const isHomepage = path === '/' || path === '/index.html' || path === '';
    const homepageBonus = isHomepage ? 50 : 0;
    const depthScore = Math.max(0, 30 - depth * 10);
    return lengthScore + depthScore + homepageBonus;
  } catch (e) {
    return 0;
  }
}

// 🔸 Begriffe hervorheben
function highlight(text, query) {
  const escaped = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 🔸 Textausschnitt mit Highlight
function highlightSnippet(content, query) {
  const lower = content.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) return content.slice(0, 100);
  const start = Math.max(0, index - 30);
  const end = Math.min(content.length, index + 70);
  const snippet = content.slice(start, end);
  return highlight(snippet, query) + '...';
}

// 🌙 Darkmode
const darkmodeSwitch = document.getElementById('darkmode-switch');
const darkmodeText = document.getElementById('darkmode-text');
const body = document.body;

window.addEventListener('load', () => {
  const darkModeEnabled = localStorage.getItem('darkmode') === 'enabled';
  if (darkModeEnabled) {
    body.classList.add('darkmode');
    darkmodeSwitch.checked = true;
    darkmodeText.textContent = 'Darkmode On';
    search();
  } else {
    body.classList.remove('darkmode');
    darkmodeSwitch.checked = false;
    darkmodeText.textContent = 'Darkmode Off';
    search();
  }
});

darkmodeSwitch.addEventListener('change', () => {
  if (darkmodeSwitch.checked) {
    body.classList.add('darkmode');
    darkmodeText.textContent = 'Darkmode On';
    localStorage.setItem('darkmode', 'enabled');
    search();
  } else {
    body.classList.remove('darkmode');
    darkmodeText.textContent = 'Darkmode Off';
    localStorage.setItem('darkmode', 'disabled');
    search();
  }
});
