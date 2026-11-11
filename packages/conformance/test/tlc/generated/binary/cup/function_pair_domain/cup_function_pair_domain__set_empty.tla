(*---
description: cup of function_pair_domain, a FcnRcdValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_function_pair_domain__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 2>> :> 3)"
---*)
