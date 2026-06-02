import test from "node:test"
import assert from "node:assert/strict"
import { createSchemaPacket, formSchemaPackets, groupByCategory, inferSchemaType, shapeContextProposal } from "../src/engine.mjs"

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

test("raw signals become weak user-reviewable context proposals", () => {
  const proposal = shapeContextProposal({
    raw_signal: {
      category: "music",
      event_type: "playlist_replay",
      payload: {
        genre: "Brazilian phonk",
        password: "should not survive"
      }
    }
  })

  assert.equal(proposal.schema_version, "memact.context_proposal.v0")
  assert.equal(proposal.input_kind, "raw_signal")
  assert.equal(proposal.status, "pending")
  assert.equal(proposal.visibility, "private")
  assert.equal(proposal.user_action_required, true)
  assert.equal(proposal.confidence, 0.35)
  assert.equal(proposal.context.evidence.genre, "Brazilian phonk")
  assert.equal(Object.hasOwn(proposal.context.evidence, "password"), false)
  assert.ok(proposal.guardrails.includes("Activity is not identity."))
})

test("context proposals with evidence get higher confidence but still require review", () => {
  const proposal = shapeContextProposal({
    category: "fitness",
    title: "Prefers strength workouts",
    context: { preference: "strength workouts" },
    source_trail: [{ type: "app_evidence", evidence: ["4 completed workouts"] }]
  })

  assert.equal(proposal.input_kind, "context_proposal")
  assert.equal(proposal.confidence, 0.7)
  assert.equal(proposal.context.preference, "strength workouts")
  assert.equal(proposal.status, "pending")
})
