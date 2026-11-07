(*---
description: greater_equal_right applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= [x \in {1}, y \in {2} |-> x + y])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    (<<1, 2>> :> 3)
    2266:0 The second argument of >= should be an integer, but instead it is:
    (<<1, 2>> :> 3)
---*)
