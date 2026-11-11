(*---
description: subbag applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subbag_function_lazy failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
