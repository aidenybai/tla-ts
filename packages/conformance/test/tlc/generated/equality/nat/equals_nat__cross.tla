(*---
description: Compares nat, a UserValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_nat__cross failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {<<1, 3>>, <<2, 3>>}
---*)
