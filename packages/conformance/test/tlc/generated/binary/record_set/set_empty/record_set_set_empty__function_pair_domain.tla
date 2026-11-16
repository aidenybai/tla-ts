(*---
description: record_set of set_empty, a SetEnumValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : ([x \in {1}, y \in {2} |-> x + y])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
