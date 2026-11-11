(*---
description: A function on 1..n is an array.
ref: tlc2/module/Json.java#isValidSequence
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_sequence_function ----
EXTENDS Json, TLC, Naturals
Test == ToJson([i \in 1..2 |-> i]) = "[1,2]"
====

(*--- recorded
all:
  exit: 0
---*)
