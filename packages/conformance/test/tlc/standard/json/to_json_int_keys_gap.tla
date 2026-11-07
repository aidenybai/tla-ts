(*---
description: A function on non-consecutive integers is an object keyed by digits.
ref: tlc2/module/Json.java#getObjectNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_int_keys_gap ----
EXTENDS Json, TLC, Naturals
Test == ToJson([i \in {2, 3} |-> i]) = "{\"2\":2,\"3\":3}"
====

(*--- recorded
all:
  exit: 0
---*)
