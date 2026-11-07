(*---
description: colon_greater of function_pair_domain, a FcnRcdValue, and set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_pair_domain__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) :> ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ((<<1, 2>> :> 3) :> {1, 2})"
---*)
