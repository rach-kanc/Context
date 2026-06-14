import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMovieBookingContext } from "../../src/categories/movie-booking.mjs";

test("movie-booking - explicit preferences are preserved", () => {
  const rawInput = {
    source: "MovieApp",
    type: "preference",
    explicit: true,
    data: {
      preferred_genres: ["Action", "Sci-Fi"],
      language_preference: "English",
      seating_preference: "Recliner"
    }
  };

  const result = normalizeMovieBookingContext(rawInput);

  assert.equal(result.category, "movie-booking");
  assert.equal(result.observation_type, "explicit_preference");
  assert.equal(result.confidence, "high");
  assert.equal(result.is_identity_claim, true);
  assert.equal(result.needs_review, false);
  assert.deepEqual(result.preferences.preferred_genres, ["Action", "Sci-Fi"]);
});

test("movie-booking - one booking remains weak observation", () => {
  const rawInput = {
    source: "MovieApp",
    type: "activity",
    explicit: false,
    data: {
      movie_title: "Interstellar",
      genre: "Sci-Fi"
    }
  };

  const result = normalizeMovieBookingContext(rawInput);

  assert.equal(result.observation_type, "weak_observation");
  assert.equal(result.confidence, "low");
  assert.equal(result.is_identity_claim, false);
  assert.equal(result.needs_review, true);
});

test("movie-booking - genre suggestion is generated", () => {
  const rawInput = {
    source: "MovieApp",
    type: "activity",
    explicit: false,
    data: {
      genre: "Comedy"
    }
  };

  const result = normalizeMovieBookingContext(rawInput);

  assert.match(
    result.suggestion,
    /Save.*Comedy.*preference/i
  );
});