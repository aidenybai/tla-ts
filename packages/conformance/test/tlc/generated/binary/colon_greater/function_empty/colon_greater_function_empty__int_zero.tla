(*---
description: colon_greater of function_empty, a FcnRcdValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> 0)"
---*)
