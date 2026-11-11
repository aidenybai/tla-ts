(*---
description: Asks whether record is in set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_nested__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) \in ({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_nested__record failed.
    Attempted to check equality of the set {1} with the value:
    [a |-> 1, b |-> 2]
---*)
