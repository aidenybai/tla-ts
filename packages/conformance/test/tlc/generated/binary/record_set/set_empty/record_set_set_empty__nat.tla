(*---
description: record_set of set_empty, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (Nat)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
