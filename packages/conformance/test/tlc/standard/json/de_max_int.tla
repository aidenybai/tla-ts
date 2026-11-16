(*---
description: 2^31-1 fits.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/max_int.json
---*)
---- MODULE de_max_int ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/max_int.json") = 2147483647
====

(*--- recorded
all:
  exit: 0
---*)
