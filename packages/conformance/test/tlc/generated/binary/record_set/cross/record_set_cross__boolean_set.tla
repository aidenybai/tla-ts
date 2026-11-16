(*---
description: record_set of cross, a SetOfTuplesValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_cross__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \X {3}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> <<1, 3>>, g |-> FALSE],
    |   [f |-> <<1, 3>>, g |-> TRUE],
    |   [f |-> <<2, 3>>, g |-> FALSE],
    |   [f |-> <<2, 3>>, g |-> TRUE] }
---*)
