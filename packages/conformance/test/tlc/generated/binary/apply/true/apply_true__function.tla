(*---
description: apply of true, a BoolValue, and function, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_true__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE)[[x \in {1, 2} |-> x * 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_true__function failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 16 to line 14, col 47 of module apply_true__function
---*)
