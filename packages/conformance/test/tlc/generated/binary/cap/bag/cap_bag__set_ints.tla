(*---
description: cap of bag, a FcnRcdValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_bag__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \cap ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_bag__set_ints failed.
    Attempted to check if the value:
    2
    is an element of the function <<1>>
---*)
