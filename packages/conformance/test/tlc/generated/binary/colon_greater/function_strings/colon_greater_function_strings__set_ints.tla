(*---
description: colon_greater of function_strings, a FcnRcdValue, and set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_strings__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) :> ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ([a |-> "a", b |-> "b"] :> {1, 2})'
---*)
