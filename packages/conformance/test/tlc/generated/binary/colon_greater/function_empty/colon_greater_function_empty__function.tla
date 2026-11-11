(*---
description: colon_greater of function_empty, a FcnRcdValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> <<2, 4>>)"
---*)
