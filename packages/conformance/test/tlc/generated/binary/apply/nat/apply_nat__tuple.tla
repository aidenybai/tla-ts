(*---
description: apply of nat, a UserValue, and tuple, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_nat__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat)[<<1, 2>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_nat__tuple failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 30 of module apply_nat__tuple
---*)
