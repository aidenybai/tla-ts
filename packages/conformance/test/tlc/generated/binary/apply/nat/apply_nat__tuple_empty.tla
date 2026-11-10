(*---
description: apply of nat, a UserValue, and tuple_empty, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_nat__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat)[<<>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_nat__tuple_empty failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 26 of module apply_nat__tuple_empty
---*)
