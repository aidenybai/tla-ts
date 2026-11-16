(*---
description: record_set of set_cup, a SetCupValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_cup__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1} \cup {2}), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 1, g |-> {}],
    |   [f |-> 1, g |-> {1}],
    |   [f |-> 2, g |-> {}],
    |   [f |-> 2, g |-> {1}] }
---*)
