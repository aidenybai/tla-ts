(*---
description: A function with mixed key kinds fails isValidSequence at the first non-integer, so is an object.
ref: tlc2/module/Json.java#isValidSequence
features:
  - Json
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE to_json_mixed_domain ----
EXTENDS Json, TLC, Naturals
CONSTANT mv
Test == ToJson((1 :> "x") @@ (mv :> "y")) = "{\"1\":\"x\",\"mv\":\"y\"}"
====

(*--- recorded
all:
  exit: 0
---*)
