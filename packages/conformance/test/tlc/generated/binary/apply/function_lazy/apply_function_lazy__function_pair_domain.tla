(*---
description: apply of function_lazy, a FcnLambdaValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[[x \in {1}, y \in {2} |-> x + y]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    (<<1, 2>> :> 3)
    is an element of Nat.
    2158:0 Attempted to check if the value:
    (<<1, 2>> :> 3)
    is an element of Nat.
---*)
