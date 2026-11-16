(*---
description: A top-level number.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/top_int.json
---*)
---- MODULE de_top_int ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/top_int.json") = 7
====

(*--- recorded
all:
  exit: 0
---*)
