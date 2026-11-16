(*---
description: JSON escapes decode to TLA+ characters.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/escapes.json
---*)
---- MODULE de_escapes ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/escapes.json") = "a\"b\\c\nd\te"
====

(*--- recorded
all:
  exit: 0
---*)
