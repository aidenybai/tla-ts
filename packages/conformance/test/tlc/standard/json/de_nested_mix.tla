(*---
description: Objects and arrays nest.
ref: tlc2/module/Json.java#getValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/nested.json
---*)
---- MODULE de_nested_mix ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/nested.json").a[1].b[1] = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
