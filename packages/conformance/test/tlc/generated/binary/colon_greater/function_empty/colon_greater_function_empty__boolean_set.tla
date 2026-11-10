(*---
description: colon_greater of function_empty, a FcnRcdValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> {FALSE, TRUE})"
---*)
