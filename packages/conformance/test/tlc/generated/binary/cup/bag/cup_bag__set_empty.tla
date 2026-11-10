(*---
description: cup of bag, a FcnRcdValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_bag__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
