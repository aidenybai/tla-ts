(*---
description: cap of set_ints, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_ints__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cap (SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_set_ints__bag failed.
    Attempted to check if the value:
    2
    is an element of the function <<1>>
---*)
