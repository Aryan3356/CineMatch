
 
const mongoose = require("mongoose");
 
const ratingSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    userId: {
      // Simple session-based or anonymous ID
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    review: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);
 
// Prevent same user from rating the same movie twice
ratingSchema.index({ movieId: 1, userId: 1 }, { unique: true });
 
module.exports = mongoose.model("Rating", ratingSchema);
