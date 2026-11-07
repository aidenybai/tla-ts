(*---
description: An object is a record.
ref: tlc2/module/Json.java#getRecordValue
features:
  - Json
flags:
  - expression
outcome: success
includes:
  - fixtures/object.json
---*)
---- MODULE de_object ----
EXTENDS Json, TLC, Naturals
Test == JsonDeserialize("fixtures/object.json") = [a |-> 1, b |-> <<TRUE, "x">>]
====

(*--- recorded
all:
  exit: 0
---*)
