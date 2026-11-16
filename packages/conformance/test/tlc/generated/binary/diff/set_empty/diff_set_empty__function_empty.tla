(*---
description: diff of set_empty, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
