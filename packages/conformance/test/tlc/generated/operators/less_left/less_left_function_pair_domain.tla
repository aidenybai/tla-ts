(*---
description: less_left applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1}, y \in {2} |-> x + y] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module less_left_function_pair_domain failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    (<<1, 2>> :> 3)
---*)
