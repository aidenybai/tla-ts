(*---
description: apply of nat, a UserValue, and double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_nat__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat)[(1 :> 2) @@ (2 :> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_nat__double_at failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 42 of module apply_nat__double_at
---*)
