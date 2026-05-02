
 
const mongoose = require("mongoose");
 
const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    genres: {
      type: [String],
      required: true,
      index: true,
    },
    moods: {
      // Tags like "feel-good", "thrilling", "thought-provoking", etc.
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    director: {
      type: String,
      default: "Unknown",
    },
    cast: {
      type: [String],
      default: [],
    },
    rating: {
      // Average user rating (1–10)
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    ratingCount: {
      // Number of users who have rated this movie
      type: Number,
      default: 0,
    },
    imdbRating: {
      // Official IMDb rating for display purposes
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    posterUrl: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      default: "English",
    },
    duration: {
      // Duration in minutes
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);
 
// Text index for full-text search. Use a custom language override field so
// the movie's "language" value is stored as normal data, not a MongoDB index setting.
movieSchema.index(
  { title: "text", description: "text", director: "text" },
  { default_language: "none", language_override: "textLanguage" }
);
 
module.exports = mongoose.model("Movie", movieSchema);
 
