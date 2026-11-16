(*---
description: cup of set_empty, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
