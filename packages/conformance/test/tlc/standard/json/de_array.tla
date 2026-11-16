(*---
description: An array is a tuple.
ref: tlc2/module/Json.java#getTupleValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/array.json
---*)
---- MODULE de_array ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/array.json") = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
