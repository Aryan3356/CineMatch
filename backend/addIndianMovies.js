require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("./models/Movie");
const indianMovies = require("./indianMovies");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/movierecommender";

async function addIndianMovies() {
  try {
    await mongoose.connect(MONGO_URI);

    for (const movie of indianMovies) {
      await Movie.updateOne(
        { title: movie.title },
        { $set: movie },
        { upsert: true }
      );
      console.log(`Saved: ${movie.title}`);
    }

    await mongoose.disconnect();
    console.log(`Done. Added/updated ${indianMovies.length} Indian movies.`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to add Indian movies:", err.message);
    process.exit(1);
  }
}

addIndianMovies();
