(*---
description: apply of int_negative, a IntValue, and double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int_negative__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3)[(1 :> 2) @@ (2 :> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int_negative__double_at failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 41 of module apply_int_negative__double_at
---*)
