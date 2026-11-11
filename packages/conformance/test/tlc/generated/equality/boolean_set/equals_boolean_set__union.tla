(*---
description: Compares boolean_set, a SetEnumValue, with union, a UnionValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_boolean_set__union failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    1
---*)
