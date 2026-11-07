(*---
description: A top-level Boolean.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/top_bool.json
---*)
---- MODULE de_top_bool ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/top_bool.json") = TRUE
====

(*--- recorded
all:
  exit: 0
---*)
