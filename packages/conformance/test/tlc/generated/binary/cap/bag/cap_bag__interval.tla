(*---
description: cap of bag, a FcnRcdValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_bag__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \cap (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_bag__interval failed.
    Attempted to check if the value:
    1
    is an element of the function <<1>>
---*)
