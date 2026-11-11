(*---
description: An empty object equals the empty function.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/empty_object.json
---*)
---- MODULE de_empty_object_is_empty_function ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/empty_object.json") = <<>> /\ DOMAIN JsonDeserialize("fixtures/empty_object.json") = {}
====

(*--- recorded
all:
  exit: 0
---*)
