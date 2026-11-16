(*---
description: cup of set_empty, a SetEnumValue, and colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
