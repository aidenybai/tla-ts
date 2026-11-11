(*---
description: A non-ASCII character is kept and printed.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/non_ascii.json
---*)
---- MODULE de_non_ascii_prints ----
EXTENDS Json, TLC, Naturals
Test == PrintT(JsonDeserialize("fixtures/non_ascii.json"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "é"'
---*)
