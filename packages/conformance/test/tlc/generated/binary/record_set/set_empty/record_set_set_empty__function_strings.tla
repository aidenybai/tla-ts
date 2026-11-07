(*---
description: record_set of set_empty, a SetEnumValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : ([x \in {"a", "b"} |-> x])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
