(*---
description: cap of string_set, a UserValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_string_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) \cap ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_string_set__cross failed.
    2158:0 Attempted to check if the value:
    <<1, 3>>
    is an element of STRING.
---*)
