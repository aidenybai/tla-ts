(*---
description: Asks whether nat is in boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_boolean_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) \in (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_boolean_set__nat failed.
    Attempted to compare overridden value Nat with non-overridden value:
    TRUE
---*)
