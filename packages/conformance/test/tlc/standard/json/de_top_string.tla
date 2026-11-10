(*---
description: A top-level string.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/top_string.json
---*)
---- MODULE de_top_string ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/top_string.json") = "s"
====

(*--- recorded
all:
  exit: 0
---*)
