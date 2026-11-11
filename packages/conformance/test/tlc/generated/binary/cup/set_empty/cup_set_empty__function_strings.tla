(*---
description: cup of set_empty, a SetEnumValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> "a", b |-> "b"]'
---*)
