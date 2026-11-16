(*---
description: A function on the empty domain is a sequence, so an empty array.
ref: tlc2/module/Json.java#isValidSequence
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_empty_function ----
EXTENDS Json, TLC, Naturals
Test == ToJson([x \in {} |-> 1]) = "[]"
====

(*--- recorded
all:
  exit: 0
---*)
