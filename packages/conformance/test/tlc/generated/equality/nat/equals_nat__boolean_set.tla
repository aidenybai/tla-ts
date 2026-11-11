(*---
description: Compares nat, a UserValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_nat__boolean_set failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {FALSE, TRUE}
---*)
