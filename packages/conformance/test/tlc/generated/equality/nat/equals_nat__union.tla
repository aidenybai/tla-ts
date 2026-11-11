(*---
description: Compares nat, a UserValue, with union, a UnionValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_nat__union failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {1, 2}
---*)
