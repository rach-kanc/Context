// Minimal Node.js example for proposing music context.
// Copy this file, replace the placeholders, and keep the API key on the server.
// API keys must stay on the server; do not put them in browser code.

const APP_ID = "your-app-id";
const API_KEY = "your-api-key";
const CONNECTION_ID = "your-connection-id";

// This is the proposed music context we want to send for review.
// Each field describes a preference signal, not a permanent identity claim.
const proposedContext = {
  category: "music",
  // Genres the user tends to like.
  favorite_genres: ["indie rock", "jazz"],
  // Genres the user tends to skip or dislike.
  disliked_genres: ["heavy metal"],
  // Artists that appear repeatedly in listening history.
  frequent_artists: ["The National", "Nujabes"],
  // Artists the user skips often.
  skipped_artists: ["Artist X"],
  // Playlist or session themes the user returns to.
  playlist_themes: ["late-night coding", "road trip"],
  // Listening situations or moods the user explicitly reports.
  listening_moods: ["focus"],
  // Whether the user wants discovery or familiar tracks.
  discovery_preferences: ["discover new artists"],
  // Explicit user-stated preferences, like clean lyrics.
  explicit_preferences: ["clean lyrics"],
};

// A user-facing Wiki entry that can be reviewed, edited, or rejected.
const proposedWikiEntry = {
  title: "Music preferences",
  body: "Likes indie rock and jazz, listens for focus and road trips, and prefers discovering new artists.",
};

async function main() {
  const response = await fetch("https://api.example.com/v1/context/proposals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      app_id: APP_ID,
      connection_id: CONNECTION_ID,
      category: "music",
      proposed_context: proposedContext,
      proposed_wiki_entry: proposedWikiEntry,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  console.log("Proposed music context submitted for user review:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});