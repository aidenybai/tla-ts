(*---
description: colon_greater of function, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) :> ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 4>> :> {<<1, 3>>, <<2, 3>>})"
---*)
