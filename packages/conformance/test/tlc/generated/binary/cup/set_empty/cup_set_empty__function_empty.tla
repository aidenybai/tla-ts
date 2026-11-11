(*---
description: cup of set_empty, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
