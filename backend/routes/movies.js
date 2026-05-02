// routes/movies.js
// All API routes related to movies: search, filter, recommend, rate

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Movie = require("../models/Movie");
const Rating = require("../models/Rating");

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function makeRegex(value) {
  return new RegExp(escapeRegex(value), "i");
}

function isValidMovieId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const preferenceKeywords = {
  genres: {
    Action: ["action", "fight", "battle", "superhero", "fast", "adventure"],
    Adventure: ["adventure", "journey", "quest", "explore", "epic"],
    Animation: ["animation", "animated", "cartoon", "kids", "family"],
    Biography: ["biography", "true story", "real life", "based on true"],
    Comedy: ["comedy", "funny", "laugh", "humor", "light"],
    Crime: ["crime", "mafia", "detective", "criminal", "mystery"],
    Drama: ["drama", "serious", "emotional", "life"],
    Family: ["family", "kids", "children", "parents"],
    Fantasy: ["fantasy", "magical", "magic"],
    History: ["history", "historical", "war"],
    Horror: ["horror", "scary", "fear", "ghost", "terrifying"],
    Musical: ["music", "musical", "songs"],
    Mystery: ["mystery", "suspense", "detective"],
    Romance: ["romance", "romantic", "love", "date"],
    "Sci-Fi": ["sci-fi", "science fiction", "space", "future", "technology", "ai"],
    Thriller: ["thriller", "suspense", "intense", "twist"],
  },
  moods: {
    dark: ["dark", "serious", "gritty"],
    emotional: ["emotional", "cry", "heart touching", "sad"],
    epic: ["epic", "big", "grand"],
    "feel-good": ["feel good", "feel-good", "happy", "comfort", "light"],
    funny: ["funny", "laugh", "comedy", "humor"],
    inspiring: ["inspiring", "motivation", "motivational", "success"],
    intense: ["intense", "serious", "strong"],
    magical: ["magical", "magic", "fantasy"],
    "mind-bending": ["mind bending", "mind-bending", "complex", "confusing", "twist"],
    nostalgic: ["nostalgic", "classic", "old"],
    romantic: ["romantic", "love", "date"],
    terrifying: ["terrifying", "scary", "horror", "fear"],
    "thought-provoking": ["thought provoking", "thought-provoking", "deep", "meaningful"],
    thrilling: ["thrilling", "exciting", "suspense", "edge"],
    uplifting: ["uplifting", "positive", "hopeful"],
  },
};

function detectPreferences(prompt = "") {
  const text = prompt.toLowerCase();
  const matches = { genres: [], moods: [] };

  Object.entries(preferenceKeywords).forEach(([type, groups]) => {
    Object.entries(groups).forEach(([label, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        matches[type].push(label);
      }
    });
  });

  return matches;
}

function scoreMovie(movie, preferences, prompt) {
  let score = movie.rating || 0;
  const reasons = [];
  const promptWords = prompt.toLowerCase().split(/\W+/).filter(word => word.length > 3);

  (movie.genres || []).forEach(genre => {
    if (preferences.genres.includes(genre)) {
      score += 5;
      reasons.push(`matches ${genre}`);
    }
  });

  (movie.moods || []).forEach(mood => {
    if (preferences.moods.includes(mood)) {
      score += 4;
      reasons.push(`feels ${mood}`);
    }
  });

  const searchableText = [
    movie.title,
    movie.description,
    movie.director,
    ...(movie.cast || []),
    ...(movie.genres || []),
    ...(movie.moods || []),
  ].join(" ").toLowerCase();

  promptWords.forEach(word => {
    if (searchableText.includes(word)) {
      score += 1;
    }
  });

  if (movie.rating >= 8.5) {
    reasons.push("highly rated");
  }

  return {
    score,
    reasons: [...new Set(reasons)].slice(0, 4),
  };
}

// GET /api/movies
// Fetch all movies with optional filters:
//   ?genre=Action&mood=thrilling&search=inception&limit=20&page=1
router.get("/", async (req, res) => {
  try {
    const { genre, mood, search, limit = 20, page = 1, sortBy = "rating" } = req.query;
    const pageNumber = parsePositiveInt(page, 1, 1000);
    const limitNumber = parsePositiveInt(limit, 20, 50);

    const filter = {};

    // Genre filter (case-insensitive)
    if (genre && genre !== "All") {
      filter.genres = { $regex: makeRegex(genre) };
    }

    // Mood filter (case-insensitive)
    if (mood && mood !== "All") {
      filter.moods = { $regex: makeRegex(mood) };
    }

    // Text search on title and description
    if (search) {
      const searchRegex = makeRegex(search);
      filter.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { director: { $regex: searchRegex } },
      ];
    }

    // Sort options
    const sortOptions = {
      rating: { rating: -1 },
      year: { year: -1 },
      title: { title: 1 },
      ratingCount: { ratingCount: -1 },
    };
    const sort = sortOptions[sortBy] || { rating: -1 };

    const skip = (pageNumber - 1) * limitNumber;
    const total = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    res.json({
      movies,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/movies/recommend
// Suggest movies based on preferred genres and moods
//   ?genres=Action,Sci-Fi&moods=thrilling,mind-bending&exclude=<movieId>
router.get("/recommend", async (req, res) => {
  try {
    const { genres, moods, exclude, limit = 6 } = req.query;
    const limitNumber = parsePositiveInt(limit, 6, 20);

    const filter = {};
    const orConditions = [];

    if (genres) {
      const genreList = genres.split(",").map((g) => g.trim()).filter(Boolean);
      if (genreList.length) {
        orConditions.push({ genres: { $in: genreList.map(makeRegex) } });
      }
    }

    if (moods) {
      const moodList = moods.split(",").map((m) => m.trim()).filter(Boolean);
      if (moodList.length) {
        orConditions.push({ moods: { $in: moodList.map(makeRegex) } });
      }
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    // Exclude a specific movie (e.g. currently viewed movie)
    if (exclude) {
      if (!isValidMovieId(exclude)) {
        return res.status(400).json({ error: "Invalid movie ID" });
      }
      filter._id = { $ne: exclude };
    }

    const movies = await Movie.find(filter)
      .sort({ rating: -1, ratingCount: -1 })
      .limit(limitNumber);

    res.json({ movies });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/movies/genres
// Get all unique genres from the database
// GET /api/movies/ai-suggest
// AI-style assistant: reads a natural language prompt and automatically
// recommends movies by detecting mood/genre keywords and scoring matches.
router.get("/ai-suggest", async (req, res) => {
  try {
    const { prompt = "", limit = 5 } = req.query;
    const cleanPrompt = prompt.trim();
    const limitNumber = parsePositiveInt(limit, 5, 10);

    if (!cleanPrompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const preferences = detectPreferences(cleanPrompt);
    const movies = await Movie.find({});

    const suggestions = movies
      .map(movie => {
        const result = scoreMovie(movie, preferences, cleanPrompt);
        return {
          movie,
          matchScore: Math.round(result.score * 10) / 10,
          reasons: result.reasons.length ? result.reasons : ["best overall match"],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limitNumber);

    const detected = [
      ...preferences.genres.map(value => ({ type: "genre", value })),
      ...preferences.moods.map(value => ({ type: "mood", value })),
    ];

    const explanation = detected.length
      ? `I detected ${detected.map(item => item.value).join(", ")} and ranked matching movies by mood, genre, and rating.`
      : "I did not detect a specific mood or genre, so I recommended highly rated movies from the database.";

    res.json({ prompt: cleanPrompt, detected, explanation, suggestions });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/genres", async (req, res) => {
  try {
    const genres = await Movie.distinct("genres");
    res.json({ genres: genres.sort() });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/movies/moods
// Get all unique moods from the database
router.get("/moods", async (req, res) => {
  try {
    const moods = await Movie.distinct("moods");
    res.json({ moods: moods.sort() });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/movies/:id
// Get a single movie by ID
router.get("/:id", async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ movie });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// POST /api/movies/:id/rate
// Submit or update a rating for a movie
// Body: { userId, score, review }
router.post("/:id/rate", async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    const { userId, score, review } = req.body;
    const numericScore = Number(score);

    if (!userId || score === undefined || score === null || score === "") {
      return res.status(400).json({ error: "userId and score are required" });
    }

    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 10) {
      return res.status(400).json({ error: "Score must be between 1 and 10" });
    }

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    // Upsert: update if exists, insert if not
    const existingRating = await Rating.findOne({ movieId: req.params.id, userId });

    if (existingRating) {
      existingRating.score = numericScore;
      existingRating.review = review || "";
      await existingRating.save();
    } else {
      await Rating.create({ movieId: req.params.id, userId, score: numericScore, review: review || "" });
    }

    // Recalculate the movie's average rating from all stored ratings
    const allRatings = await Rating.find({ movieId: req.params.id });
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

    movie.rating = Math.round(avg * 10) / 10; // Round to 1 decimal
    movie.ratingCount = allRatings.length;
    await movie.save();

    res.json({ message: "Rating saved", newRating: movie.rating, ratingCount: movie.ratingCount });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// GET /api/movies/:id/ratings
// Get all ratings/reviews for a movie
router.get("/:id/ratings", async (req, res) => {
  try {
    if (!isValidMovieId(req.params.id)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    const ratings = await Rating.find({ movieId: req.params.id }).sort({ createdAt: -1 });
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
