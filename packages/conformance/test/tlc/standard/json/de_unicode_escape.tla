(*---
description: A \u escape decodes to one character.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/unicode.json
---*)
---- MODULE de_unicode_escape ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/unicode.json") = "A"
====

(*--- recorded
all:
  exit: 0
---*)
