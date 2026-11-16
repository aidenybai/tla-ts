(*---
description: append of double_at, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), {1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, {<<1, 3>>, <<2, 3>>}>>"
---*)
