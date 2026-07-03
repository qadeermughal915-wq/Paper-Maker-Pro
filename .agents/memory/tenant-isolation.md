---
name: Multi-tenant ownership checks (paperz.pk)
description: Any client-provided foreign key must be verified to belong to the caller's school before insert/update.
---

# Per-school tenant isolation

Rule: In this app, every taxonomy/reference ID that arrives from the client
(classId, subjectId, chapterId, topicId, questionId, paperId, etc.) must be
verified to belong to `req.localUser.schoolId` before it is inserted, updated,
or joined into a response. Reject mismatches with HTTP 400.

**Why:** Reference tables (classes/subjects/chapters/topics) are globally keyed
by numeric serial IDs and all carry a `school_id`. Trusting a client-supplied ID
without checking ownership lets a user of one school reference another school's
rows by guessing IDs, leaking cross-tenant data via enrichment joins. A code
review caught create/import/update trusting these IDs blindly.

**How to apply:** Use the ownership-check pattern (see `ownsTaxonomy` in
`artifacts/api-server/src/routes/questions.ts`) — it also validates parent/child
consistency (subject belongs to class, chapter to subject, topic to chapter).
Apply the same guard to any new route that accepts reference IDs. The `WHERE id=?
AND school_id=?` pattern on the target row (already used for get/update/delete of
questions) is the other half of the same discipline.
