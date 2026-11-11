(*---
description: colon_greater of function_empty, a FcnRcdValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> STRING)"
---*)
