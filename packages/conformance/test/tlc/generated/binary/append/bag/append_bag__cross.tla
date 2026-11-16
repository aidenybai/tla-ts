(*---
description: append of bag, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {<<1, 3>>, <<2, 3>>}>>"
---*)
