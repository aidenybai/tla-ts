(*---
description: to_string applied to bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<1>>"'
---*)
