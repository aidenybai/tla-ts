(*---
description: A negative number.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/negative.json
---*)
---- MODULE de_negative ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/negative.json") = 0 - 5
====

(*--- recorded
all:
  exit: 0
---*)
