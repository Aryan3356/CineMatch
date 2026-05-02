// public/app.js
// Main frontend JS — handles all UI logic, events, and API calls
// No framework — vanilla JS for simplicity in a class project

// ── Config ────────────────────────────────────
const BASE_URL = "/api";

// ── State ─────────────────────────────────────
const state = {
  genre: "All",
  mood: "All",
  search: "",
  sortBy: "rating",
  page: 1,
  totalPages: 1,
  selectedMovieId: null,
};

// ── User ID (persisted in localStorage) ───────
function getUserId() {
  let id = localStorage.getItem("movieapp_userId");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("movieapp_userId", id);
  }
  return id;
}

// ── API Helpers ────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Rendering Utilities ────────────────────────
function renderStars(rating, scale10 = true) {
  const score = scale10 ? rating / 2 : rating;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (score >= i) html += `<span class="star filled">★</span>`;
    else if (score >= i - 0.5) html += `<span class="star half">★</span>`;
    else html += `<span class="star empty">☆</span>`;
  }
  return html;
}

function moodEmoji(mood) {
  const map = {
    "feel-good": "😊", thrilling: "😱", dark: "🌑", emotional: "😢",
    inspiring: "✨", "thought-provoking": "🧠", "mind-bending": "🌀",
    funny: "😂", romantic: "❤️", epic: "⚡", nostalgic: "🎞️",
    intense: "🔥", terrifying: "👻", uplifting: "🌅", magical: "🪄",
    quirky: "🌈", edgy: "🗡️",
  };
  return map[mood] || "🎬";
}

function truncate(str, n = 140) {
  return str && str.length > n ? str.slice(0, n) + "…" : str;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function formatReviewDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderReviews(ratings = []) {
  const reviews = ratings.filter(rating => rating.review && rating.review.trim());

  if (!reviews.length) {
    return `<p class="reviews-empty">No written reviews yet. Be the first to add one.</p>`;
  }

  return reviews.map(rating => `
    <article class="review-item">
      <div class="review-header">
        <span class="review-score">${rating.score}/10</span>
        <span class="review-user">${escapeHTML(rating.userId || "Anonymous")}</span>
        <span class="review-date">${formatReviewDate(rating.updatedAt || rating.createdAt)}</span>
      </div>
      <p class="review-text">${escapeHTML(rating.review)}</p>
    </article>
  `).join("");
}

async function loadReviews(movieId, target = document.getElementById("reviewsList")) {
  if (!target) return;
  target.innerHTML = `<p class="reviews-empty">Loading reviews…</p>`;

  try {
    const { ratings } = await apiFetch(`/movies/${movieId}/ratings`);
    target.innerHTML = renderReviews(ratings);
  } catch (err) {
    target.innerHTML = `<p class="reviews-empty">Could not load reviews.</p>`;
    console.error(err);
  }
}

function posterHTML(movie, large = false) {
  const size = large ? "modal-poster" : "movie-poster";
  if (movie.posterUrl) {
    return `<img class="${size}" src="${movie.posterUrl}" alt="${movie.title}" loading="lazy"
             onerror="this.outerHTML='<div class=&quot;${large ? "modal-poster-placeholder" : "movie-poster-placeholder"}&quot;>🎬</div>'">`;
  }
  const placeholder = large ? "modal-poster-placeholder" : "movie-poster-placeholder";
  return `<div class="${placeholder}">🎬</div>`;
}

// ── Build query string from state ─────────────
function buildQuery() {
  const p = new URLSearchParams();
  if (state.genre !== "All") p.set("genre", state.genre);
  if (state.mood !== "All") p.set("mood", state.mood);
  if (state.search) p.set("search", state.search);
  p.set("sortBy", state.sortBy);
  p.set("page", state.page);
  p.set("limit", 12);
  return p.toString();
}

// ── Render Movie Card ──────────────────────────
function renderCard(movie, small = false) {
  const genres = (movie.genres || []).slice(0, 2).map(g =>
    `<span class="genre-badge">${g}</span>`).join("");

  return `
    <div class="movie-card ${small ? "small-card" : ""}" data-id="${movie._id}">
      ${posterHTML(movie)}
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-year">${movie.year} · ${movie.language || "English"}</div>
        <div class="movie-genres">${genres}</div>
        <div class="movie-rating-row">
          <div class="stars">${renderStars(movie.rating)}</div>
          <span class="rating-value">${movie.rating.toFixed(1)}</span>
          <span class="rating-count">(${movie.ratingCount})</span>
        </div>
      </div>
    </div>`;
}

function renderAiSuggestion(suggestion) {
  const movie = suggestion.movie;
  const reasons = (suggestion.reasons || [])
    .map(reason => `<span>${escapeHTML(reason)}</span>`)
    .join("");

  return `
    <div class="ai-suggestion" data-id="${movie._id}">
      ${posterHTML(movie)}
      <div class="ai-suggestion-body">
        <div class="ai-suggestion-title">${escapeHTML(movie.title)}</div>
        <div class="ai-suggestion-meta">${movie.year} · ${movie.rating.toFixed(1)}/10 · Match ${suggestion.matchScore}</div>
        <p>${escapeHTML(truncate(movie.description, 120))}</p>
        <div class="ai-reasons">${reasons}</div>
      </div>
    </div>
  `;
}

async function runAiAssistant(prompt) {
  const result = document.getElementById("aiResult");
  result.classList.add("active");
  result.innerHTML = `<div class="ai-loading">Thinking through your mood...</div>`;

  try {
    const data = await apiFetch(`/movies/ai-suggest?prompt=${encodeURIComponent(prompt)}&limit=4`);
    result.innerHTML = `
      <div class="ai-explanation">${escapeHTML(data.explanation)}</div>
      <div class="ai-suggestions-grid">
        ${data.suggestions.map(renderAiSuggestion).join("")}
      </div>
    `;

    result.querySelectorAll(".ai-suggestion").forEach(card => {
      card.addEventListener("click", () => openModal(card.dataset.id));
    });
  } catch (err) {
    result.innerHTML = `<div class="ai-loading">Could not generate suggestions right now.</div>`;
    console.error(err);
  }
}

// ── Load & Render Movies ───────────────────────
async function loadMovies() {
  const grid = document.getElementById("moviesGrid");
  const countEl = document.getElementById("resultCount");
  grid.innerHTML = `<div class="loading-spinner" style="grid-column:1/-1">
    <div class="spinner"></div> Loading movies…</div>`;

  try {
    const data = await apiFetch(`/movies?${buildQuery()}`);
    state.totalPages = data.totalPages;
    countEl.textContent = `${data.total} movies found`;

    if (!data.movies.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🎭</div>
        <p>No movies match your selection.<br>Try a different genre or mood.</p></div>`;
      renderPagination();
      return;
    }

    grid.innerHTML = data.movies.map(m => renderCard(m)).join("");

    // Attach click handlers on each card
    grid.querySelectorAll(".movie-card").forEach(card => {
      card.addEventListener("click", () => openModal(card.dataset.id));
    });

    renderPagination();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">⚠️</div>
      <p>Could not connect to backend.<br>Make sure the server is running on port 5000.</p></div>`;
    console.error(err);
  }
}

// ── Pagination ─────────────────────────────────
function renderPagination() {
  const el = document.getElementById("pagination");
  if (state.totalPages <= 1) { el.innerHTML = ""; return; }

  let html = `<button class="page-btn" onclick="changePage(${state.page - 1})" ${state.page === 1 ? "disabled" : ""}>← Prev</button>`;
  for (let i = 1; i <= state.totalPages; i++) {
    html += `<button class="page-btn ${i === state.page ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="changePage(${state.page + 1})" ${state.page === state.totalPages ? "disabled" : ""}>Next →</button>`;
  el.innerHTML = html;
}

window.changePage = function (p) {
  if (p < 1 || p > state.totalPages) return;
  state.page = p;
  loadMovies();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ── Filter Chips ───────────────────────────────
function initGenreChips(genres) {
  const el = document.getElementById("genreChips");
  const all = ["All", ...genres];
  el.innerHTML = all.map(g =>
    `<button class="chip ${g === state.genre ? "active" : ""}" data-genre="${g}">${g}</button>`
  ).join("");

  el.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.genre = btn.dataset.genre;
      state.page = 1;
      el.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadMovies();
    });
  });
}

function initMoodChips(moods) {
  const el = document.getElementById("moodChips");
  const all = ["All", ...moods];
  el.innerHTML = all.map(m =>
    `<button class="chip ${m === state.mood ? "active" : ""}" data-mood="${m}">${moodEmoji(m)} ${m}</button>`
  ).join("");

  el.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      state.mood = btn.dataset.mood;
      state.page = 1;
      el.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadMovies();
    });
  });
}

// ── Search ─────────────────────────────────────
let searchTimer;
document.getElementById("searchInput").addEventListener("input", e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    state.page = 1;
    loadMovies();
  }, 350);
});

// ── Sort ───────────────────────────────────────
document.getElementById("sortSelect").addEventListener("change", e => {
  state.sortBy = e.target.value;
  state.page = 1;
  loadMovies();
});

document.getElementById("aiForm").addEventListener("submit", e => {
  e.preventDefault();
  const prompt = document.getElementById("aiPrompt").value.trim();

  if (!prompt) {
    alert("Tell the AI assistant what kind of movie you want.");
    return;
  }

  runAiAssistant(prompt);
});

// ── Modal ──────────────────────────────────────
async function openModal(id) {
  state.selectedMovieId = id;
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");
  overlay.classList.add("active");
  content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div> Loading…</div>`;

  try {
    const { movie } = await apiFetch(`/movies/${id}`);

    // Fetch recommendations now that we have the selected movie's genres and moods.
    const recData = await apiFetch(
      `/movies/recommend?genres=${movie.genres.join(",")}&moods=${movie.moods.join(",")}&exclude=${id}&limit=6`
    ).catch(() => ({ movies: [] }));

    const imdbLine = movie.imdbRating
      ? `<span>IMDb: <strong>${movie.imdbRating}</strong></span><span class="separator">·</span>` : "";

    const moodTags = (movie.moods || []).map(m =>
      `<span class="mood-tag">${moodEmoji(m)} ${m}</span>`).join("");

    const genreBadges = (movie.genres || []).map(g =>
      `<span class="genre-badge">${g}</span>`).join("");

    const recCards = recData.movies.length
      ? recData.movies.map(m => renderCard(m, true)).join("")
      : `<p style="color:var(--text-muted);font-size:.85rem">No similar movies found.</p>`;

    const duration = movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : "";

    content.innerHTML = `
      <button class="modal-close" id="modalClose">✕</button>
      <div class="modal-top">
        ${posterHTML(movie, true)}
        <div class="modal-body">
          <h2 class="modal-title">${movie.title}</h2>
          <div class="modal-meta">
            <span>${movie.year}</span>
            ${duration ? `<span class="separator">·</span><span>${duration}</span>` : ""}
            <span class="separator">·</span><span>${movie.language || "English"}</span>
            <span class="separator">·</span>
            <div class="movie-genres">${genreBadges}</div>
          </div>

          <div class="modal-rating-display">
            <div class="modal-rating-score">${movie.rating.toFixed(1)}</div>
            <div class="modal-rating-info">
              <div class="modal-stars stars">${renderStars(movie.rating)}</div>
              <div style="font-size:.78rem;color:var(--text-muted)">${movie.ratingCount} ratings</div>
              ${movie.imdbRating ? `<div class="modal-imdb">IMDb: ${movie.imdbRating}</div>` : ""}
            </div>
          </div>

          <p class="modal-description">${movie.description}</p>

          <div class="modal-tags">${moodTags}</div>

          ${movie.director ? `<p class="modal-cast"><strong>Director:</strong> ${movie.director}</p>` : ""}
          ${movie.cast?.length ? `<p class="modal-cast"><strong>Cast:</strong> ${movie.cast.join(", ")}</p>` : ""}
        </div>
      </div>

      <div class="modal-rate-section">
        <h3>Rate this Movie</h3>
        <div class="star-picker" id="starPicker">
          ${[1,2,3,4,5,6,7,8,9,10].map(n =>
            `<span class="star-pick" data-score="${n}" title="${n}/10">★</span>`
          ).join("")}
        </div>
        <textarea class="rating-review-input" id="reviewText" rows="2"
          placeholder="Write a short review (optional)…"></textarea>
        <button class="btn-submit-rating" id="submitRating">Submit Rating</button>
        <div class="rating-success" id="ratingSuccess">✓ Rating saved! Thank you.</div>
      </div>

      <div class="reviews-section">
        <h3>User Reviews</h3>
        <div class="reviews-list" id="reviewsList">
          <p class="reviews-empty">Loading reviews…</p>
        </div>
      </div>

      ${recData.movies.length ? `
      <div class="recommendations-section">
        <h3>🎬 You Might Also Like</h3>
        <div class="rec-grid" id="recGrid">${recCards}</div>
      </div>` : ""}
    `;

    // Star picker interactivity
    let selectedScore = 0;
    const picks = content.querySelectorAll(".star-pick");
    picks.forEach(star => {
      star.addEventListener("mouseover", () => {
        picks.forEach((s, i) => s.classList.toggle("selected", i < star.dataset.score));
      });
      star.addEventListener("click", () => {
        selectedScore = parseInt(star.dataset.score);
        picks.forEach((s, i) => s.classList.toggle("selected", i < selectedScore));
      });
    });
    content.querySelector("#starPicker").addEventListener("mouseleave", () => {
      picks.forEach((s, i) => s.classList.toggle("selected", i < selectedScore));
    });

    // Submit rating
    content.querySelector("#submitRating").addEventListener("click", async () => {
      if (!selectedScore) {
        alert("Please select a star rating first.");
        return;
      }
      try {
        await apiPost(`/movies/${id}/rate`, {
          userId: getUserId(),
          score: selectedScore,
          review: content.querySelector("#reviewText").value,
        });
        content.querySelector("#ratingSuccess").style.display = "block";
        content.querySelector("#reviewText").value = "";
        await loadReviews(id, content.querySelector("#reviewsList"));
        setTimeout(() => loadMovies(), 800); // Refresh grid
      } catch (err) {
        alert("Failed to save rating. Please try again.");
      }
    });

    // Recommendations click
    content.querySelectorAll(".rec-grid .movie-card").forEach(card => {
      card.addEventListener("click", () => {
        overlay.classList.remove("active");
        setTimeout(() => openModal(card.dataset.id), 100);
      });
    });

    // Close button
    content.querySelector("#modalClose").addEventListener("click", closeModal);
    loadReviews(id, content.querySelector("#reviewsList"));

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>⚠️ Failed to load movie.</p></div>`;
    console.error(err);
  }
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
}

document.getElementById("modalOverlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// ── Init App ───────────────────────────────────
async function init() {
  try {
    const [{ genres }, { moods }] = await Promise.all([
      apiFetch("/movies/genres"),
      apiFetch("/movies/moods"),
    ]);
    initGenreChips(genres);
    initMoodChips(moods);
  } catch (err) {
    console.warn("Could not load filters — backend may be offline");
    initGenreChips(["Action","Comedy","Drama","Horror","Sci-Fi","Romance","Thriller","Animation"]);
    initMoodChips(["feel-good","thrilling","dark","emotional","inspiring","funny","epic","mind-bending"]);
  }
  loadMovies();
}

init();
