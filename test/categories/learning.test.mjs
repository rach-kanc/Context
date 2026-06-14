import test from "node:test"
import assert from "node:assert/strict"
import {
  LEARNING_PERMISSIONS,
  LEARNING_SCHEMA,
  generateWikiEntries,
  normalizeLearningContext,
  normalizedOutputExamples,
  rawInputExamples,
  validateLearningContext,
  wikiEntryTemplates
} from "../../src/categories/learning.mjs"

test("learning schema separates stable preferences, goals, and sensitive signals", () => {
  assert.equal(LEARNING_SCHEMA.category, "learning")
  assert.ok(LEARNING_SCHEMA.sections.stable_preferences)
  assert.ok(LEARNING_SCHEMA.sections.current_goals)
  assert.ok(LEARNING_SCHEMA.sections.sensitive_signals)
  assert.equal(LEARNING_SCHEMA.sections.sensitive_signals.fields.repeated_mistakes.sensitive, true)
  assert.equal(LEARNING_SCHEMA.sections.sensitive_signals.fields.weak_areas.sensitive, true)
  assert.equal(LEARNING_SCHEMA.sections.sensitive_signals.fields.confusion_signals.sensitive, true)
})

test("learning examples exist for two app types", () => {
  assert.equal(rawInputExamples.length, 2)
  assert.equal(normalizedOutputExamples.length, 2)
  assert.ok(rawInputExamples[0].topics_viewed)
  assert.ok(rawInputExamples[1].completed_videos)
})

test("valid inference case normalizes quiz learning context and keeps wiki entries non-sensitive", () => {
  const normalized = normalizeLearningContext({
    user_id: "u_sql",
    enrolled_courses: ["SQL Mastery"],
    completed_lessons: [
      "intro-to-sql",
      "sql-joins",
      "group-by",
      "subqueries",
      "window-functions",
      "cte-basics",
      "indexing",
      "performance-tuning"
    ],
    streak: 7,
    speed_setting: 1.5
  })

  assert.equal(normalized.category, "learning")
  assert.deepEqual(normalized.stable_preferences, {
    preferred_pace: "fast"
  })
  assert.deepEqual(normalized.current_goals.active_topics, ["SQL"])
  assert.equal(normalized.current_goals.completed_lessons.length, 8)
  assert.equal(normalized.current_goals.session_streak, 7)
  assert.deepEqual(normalized.pending_approval_queue, [])

  const wiki = generateWikiEntries(normalized)
  assert.ok(wiki.length >= 2)
  assert.ok(wiki.every((entry) => entry.requires_user_confirmation === false))
  assert.ok(wiki.every((entry) => Object.hasOwn(entry, "sensitive") === false))
})

test("overconfident inference fields are dropped and flagged", () => {
  const normalized = normalizeLearningContext({
    user_id: "u_123",
    badge: "struggling-with-closures",
    dropout_risk_score: 0.7
  })

  assert.deepEqual(normalized.dropped_fields.sort(), ["badge", "dropout_risk_score"])
  assert.equal(normalized.validation.ok, false)
  assert.equal(normalized.validation.reason, "overconfident_inference")
  assert.ok(normalized.validation.issues.some((issue) => issue.field === "badge"))
  assert.equal(typeof normalized.drop_reason, "string")

  const wiki = generateWikiEntries(normalized)
  assert.equal(wiki.length, 0)
})

test("ephemeral learning signals stay in pending approval and do not enter the stored profile", () => {
  const normalized = normalizeLearningContext({
    user_id: "u_123",
    repeated_mistakes: ["stale closures"],
    weak_areas: ["closures"],
    confusion_signals: [{ topic: "closures", type: "rewatch" }]
  })

  assert.equal(normalized.pending_approval_queue.length, 3)
  assert.equal(normalized.current_goals.repeated_mistakes, undefined)
  assert.equal(normalized.current_goals.weak_areas, undefined)
  assert.equal(normalized.current_goals.confusion_signals, undefined)
  assert.equal(normalized.stable_preferences.repeated_mistakes, undefined)

  const wiki = generateWikiEntries(normalized)
  assert.ok(wiki.some((entry) => entry.requires_user_confirmation === true))
  assert.ok(wiki.every((entry) => entry.type !== "preference" || entry.requires_user_confirmation === false))
})

test("learning permissions use a tiered sensitivity model", () => {
  const scopes = Object.fromEntries(LEARNING_PERMISSIONS.map((permission) => [permission.scope, permission]))

  assert.equal(scopes["learning:preferences"].sensitivity, "low")
  assert.equal(scopes["learning:preferences"].default_granted, true)
  assert.equal(scopes["learning:goals"].sensitivity, "medium")
  assert.equal(scopes["learning:progress"].user_summary_before_approval, true)
  assert.equal(scopes["learning:signals"].sensitivity, "high")
  assert.equal(scopes["learning:signals"].requires_explicit_wiki_approval, true)
})

test("wiki templates are human-readable and non-labeling", () => {
  assert.ok(wikiEntryTemplates.some((template) => template.includes("goal")))
  assert.ok(wikiEntryTemplates.some((template) => template.includes("preferred_format")))
  assert.ok(wikiEntryTemplates.every((template) => !/struggling|weak|failing|at risk/i.test(template)))
})

test("validation helper reports overconfident inference when unsafe labels appear", () => {
  const validation = validateLearningContext({ badge: "struggling-with-closures" })
  assert.equal(validation.ok, false)
  assert.equal(validation.reason, "overconfident_inference")
})
