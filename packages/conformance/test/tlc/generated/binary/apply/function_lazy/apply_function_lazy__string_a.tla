(*---
description: apply of function_lazy, a FcnLambdaValue, and string_a, a StringValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])["a"])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_lazy__string_a failed.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
