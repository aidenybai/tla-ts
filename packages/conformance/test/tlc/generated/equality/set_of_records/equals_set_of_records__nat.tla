(*---
description: Compares set_of_records, a SetOfRcdsValue, with nat, a UserValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_records__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) = (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_of_records__nat failed.
    Attempted to check equality of the set {[a |-> 1], [a |-> 2]} with the value:
    Nat
---*)
