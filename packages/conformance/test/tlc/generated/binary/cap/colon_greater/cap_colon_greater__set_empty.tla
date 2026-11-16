(*---
description: cap of colon_greater, a FcnRcdValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_colon_greater__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
