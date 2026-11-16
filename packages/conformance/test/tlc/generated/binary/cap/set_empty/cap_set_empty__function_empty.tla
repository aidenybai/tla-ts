(*---
description: cap of set_empty, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
