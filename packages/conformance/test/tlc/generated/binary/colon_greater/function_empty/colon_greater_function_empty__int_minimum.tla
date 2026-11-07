(*---
description: colon_greater of function_empty, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> -2147483648)"
---*)
