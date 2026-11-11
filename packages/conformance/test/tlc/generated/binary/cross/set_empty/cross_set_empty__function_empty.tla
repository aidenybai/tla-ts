(*---
description: cross of set_empty, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
