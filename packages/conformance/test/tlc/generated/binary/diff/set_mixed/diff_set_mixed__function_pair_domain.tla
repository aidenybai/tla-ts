(*---
description: diff of set_mixed, a SetEnumValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_mixed__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, "a"}) \ ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_mixed__function_pair_domain failed.
    Attempted to check if the value:
    1
    is an element of the function (<<1, 2>> :> 3)
---*)
