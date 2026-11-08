(*---
description: bag_plus applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {"a", "b"} |-> x] (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_plus_function_strings failed.
    2169:0 The first argument of (+) should be a bag, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
