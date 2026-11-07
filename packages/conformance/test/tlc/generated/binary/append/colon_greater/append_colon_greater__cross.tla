(*---
description: append of colon_greater, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, {<<1, 3>>, <<2, 3>>}>>"
---*)
