(*---
description: diff of cross, a SetOfTuplesValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_cross__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \ (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<1, 3>>
    is an element of STRING.
    2158:0 Attempted to check if the value:
    <<1, 3>>
    is an element of STRING.
---*)
