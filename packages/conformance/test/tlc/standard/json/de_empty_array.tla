(*---
description: An empty array is the empty tuple.
ref: tlc2/module/Json.java#getTupleValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/empty_array.json
---*)
---- MODULE de_empty_array ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/empty_array.json") = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
