import test from "node:test"
import assert from "node:assert/strict"
import { createSchemaPacket, formSchemaPackets, groupByCategory, inferSchemaType } from "../src/engine.mjs"

test("research records create research packet", () => {
  const packets = formSchemaPackets([
    {
      record_id: "r1",
      category: "research",
      meaningful_score: 0.8,
      canonical_themes: ["api"],
      sources: []
    }
  ])
  assert.equal(packets[0].schema_version, "memact.schema_packet.v0")
  assert.equal(packets[0].schema_type, "research")
})

test("shopping records create shopping packet", () => {
  assert.equal(inferSchemaType({ category: "shopping", evidence: { title: "discount code" } }), "shopping")
})

test("low confidence ignored", () => {
  const packets = formSchemaPackets([{ category: "research", meaningful_score: 0.01 }], { minConfidence: 0.2 })
  assert.deepEqual(packets, [])
})

test("grouping and packet creation work", () => {
  const groups = groupByCategory([{ category: "learning", meaningful_score: 0.7 }])
  const packet = createSchemaPacket(groups.learning)
  assert.equal(packet.category, "learning")
})

test("reading events create reading preference packet", () => {
  const packets = formSchemaPackets([
    {
      record_id: "r1",
      category: "reading",
      meaningful_score: 0.8,
      canonical_themes: ["reading", "high_engagement", "long_read", "summary_detail_preference"],
      evidence: { article_topic: "ai policy", scroll_depth: 90 },
      sources: [{ title: "AI policy guide" }]
    },
    {
      record_id: "r2",
      category: "reading",
      meaningful_score: 0.7,
      canonical_themes: ["reading", "completion"],
      evidence: { article_topic: "ai policy" },
      sources: [{ title: "AI policy guide" }]
    }
  ])
  assert.equal(packets[0].schema_type, "reading_preferences")
  assert.equal(packets[0].attributes.preferred_topics[0], "ai policy")
  assert.equal(packets[0].attributes.preferred_summary_style, "deep_dive")
})

test("skipped topics and low scroll depth become reading attributes", () => {
  const packet = createSchemaPacket([
    {
      category: "reading",
      meaningful_score: 0.6,
      canonical_themes: ["reading", "skipped_topic", "low_engagement", "quick_summary_preference"],
      evidence: { article_topic: "celebrity", scroll_depth: 20 },
      sources: []
    }
  ])
  assert.equal(packet.attributes.skipped_topics[0], "celebrity")
  assert.equal(packet.attributes.engagement_pattern, "low_scroll_depth")
})

test("music events create music preference packet", () => {
  const packets = formSchemaPackets([
    {
      record_id: "m1",
      category: "music",
      meaningful_score: 0.9,
      canonical_themes: ["music", "favorite_genre", "artist", "playlist_theme", "discovery_preference", "explicit_preference"],
      evidence: {
        favorite_genres: ["indie rock", "jazz"],
        frequent_artists: ["The National", "Nujabes"],
        playlist_themes: ["late-night coding", "road trip"],
        discovery_preferences: ["discover new artists"],
        explicit_preferences: ["clean lyrics"],
      },
      sources: [{ title: "Spotify likes" }]
    }
  ])

  assert.equal(packets[0].schema_type, "music_preferences")
  assert.deepEqual(packets[0].attributes.favorite_genres, ["indie rock", "jazz"])
  assert.deepEqual(packets[0].attributes.frequent_artists, ["The National", "Nujabes"])
  assert.equal(packets[0].attributes.review_status, "safe_to_propose")
})

test("music packet flags sensitive signals for review", () => {
  const packet = createSchemaPacket([
    {
      record_id: "m2",
      category: "music",
      meaningful_score: 0.8,
      canonical_themes: ["music", "listening_mood"],
      evidence: {
        listening_moods: ["focus"],
        inferred_mood: "anxiety",
        mental_health: "stress",
        politics: "left",
      },
      sources: []
    }
  ])

  assert.equal(packet.schema_type, "music_preferences")
  assert.deepEqual(packet.attributes.listening_moods, ["focus"])
  assert.ok(packet.attributes.sensitive_fields.includes("inferred_mood"))
  assert.ok(packet.attributes.sensitive_fields.includes("mental_health"))
  assert.ok(packet.attributes.sensitive_fields.includes("politics"))
  assert.equal(packet.attributes.review_status, "needs_review")
})
