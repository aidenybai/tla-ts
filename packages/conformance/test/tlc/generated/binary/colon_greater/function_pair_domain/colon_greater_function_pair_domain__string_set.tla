(*---
description: colon_greater of function_pair_domain, a FcnRcdValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_pair_domain__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ((<<1, 2>> :> 3) :> STRING)"
---*)
