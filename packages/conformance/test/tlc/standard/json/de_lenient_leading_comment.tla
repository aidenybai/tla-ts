(*---
description: Gson parses the value leniently, so a comment before it is accepted.
ref: tlc2/module/Json.java#deserialize
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/comment.json
---*)
---- MODULE de_lenient_leading_comment ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/comment.json") = 1
====

(*--- recorded
all:
  exit: 0
---*)
