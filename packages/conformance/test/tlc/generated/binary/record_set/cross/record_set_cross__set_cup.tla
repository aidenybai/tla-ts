(*---
description: record_set of cross, a SetOfTuplesValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_cross__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \X {3}), g : ({1} \cup {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> <<1, 3>>, g |-> 1],
    |   [f |-> <<1, 3>>, g |-> 2],
    |   [f |-> <<2, 3>>, g |-> 1],
    |   [f |-> <<2, 3>>, g |-> 2] }
---*)
