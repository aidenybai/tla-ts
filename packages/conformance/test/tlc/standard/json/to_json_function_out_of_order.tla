(*---
description: A function built out of order but with domain 1..n is an array, after normalizing.
ref: tlc2/module/Json.java#isValidSequence
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_function_out_of_order ----
EXTENDS Json, TLC, Naturals
Test == ToJson((2 :> "b") @@ (1 :> "a")) = "[\"a\",\"b\"]"
====

(*--- recorded
all:
  exit: 0
---*)
