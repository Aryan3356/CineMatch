# CineMatch — Movie Recommender

A full-stack movie recommendation application that helps users discover films based on genre, mood, and personalized suggestions.

## Features

- **🔍 Smart Search**: Search movies by title, director, and more
- **🎭 Genre & Mood Filters**: Filter by multiple genres (Action, Comedy, Drama, etc.) and moods (feel-good, thrilling, dark, etc.)
- **🤖 AI Movie Assistant**: Get personalized recommendations by describing your mood in natural language
- **⭐ Rating System**: Rate and review movies to help other users
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🎬 Rich Movie Details**: View ratings, descriptions, directors, and cast information
- **💾 User Persistence**: Your ratings and preferences are saved locally

## Tech Stack

### Backend
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 & CSS3** - Responsive design
- **Fetch API** - HTTP requests

## Project Structure

```
movie-recommender/
├── backend/
│   ├── models/
│   │   ├── Movie.js           # Movie schema
│   │   └── Rating.js          # Rating schema
│   ├── routes/
│   │   └── movies.js          # API routes
│   ├── server.js              # Express server setup
│   ├── seed.js                # Database seed script
│   ├── addIndianMovies.js     # Add Indian movies to database
│   ├── package.json
│   └── .env.example
├── frontend/
│   └── public/
│       ├── index.html         # Main page
│       ├── app.js             # Frontend logic
│       ├── style.css          # Styling
│       └── assets/            # Images and icons
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- MongoDB (local installation)

### Installation

1. **Clone the repository**
   ```bash
   cd movie-recommender
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update `MONGO_URI` with your MongoDB connection string
   - Set `PORT` (default: 5000)
   ```bash
   cp .env.example .env
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm run dev        # Development with auto-reload
   # or
   npm start          # Production
   ```

6. **Open in browser**
   Visit `http://localhost:5000`

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies with filters and pagination
  - Query params: `genre`, `mood`, `search`, `page`, `limit`, `sortBy`
- `GET /api/movies/:id` - Get movie details by ID
- `POST /api/movies/search/ai` - Get AI-powered recommendations
  - Body: `{ prompt: "describe your mood" }`

### Ratings
- `GET /api/movies/:id/ratings` - Get all ratings for a movie
- `POST /api/movies/:id/rate` - Submit a rating
  - Body: `{ userId: "string", rating: 1-10, comment: "string" }`
- `GET /api/movies/ratings/:userId` - Get ratings by user ID

### Health Check
- `GET /api/health` - Check API and database status

## Available Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start with auto-reload (nodemon)
npm run seed       # Seed database with movies
```

## Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/movierecommender
NODE_ENV=development
```

## Features in Detail

### Smart Search
- Real-time search as you type
- Case-insensitive matching
- Search across titles, directors, and cast

### Mood-Based Recommendations
The AI assistant understands natural language inputs like:
- "I want a funny feel-good movie for family night"
- "Dark, intense thriller"
- "Inspiring biopic"

It maps keywords to genres and moods for intelligent filtering.

### Rating System
- Rate movies on a 1-10 scale
- Leave comments and reviews
- All ratings are user-specific and stored in MongoDB
- User ID is generated and persisted in localStorage

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Feel free to fork, modify, and improve the application. Potential enhancements:
- User authentication and profiles
- Advanced recommendation algorithms
- Movie trailers and external links
- Social features (follow users, share lists)
- Backend unit tests

## License

Open source. Feel free to use and modify.

## Support

For issues or questions:
1. Ensure MongoDB is running and properly configured
2. Verify Node.js version is 18+
3. Check browser console for frontend errors

---

**Happy movie watching! 🎬🍿**
