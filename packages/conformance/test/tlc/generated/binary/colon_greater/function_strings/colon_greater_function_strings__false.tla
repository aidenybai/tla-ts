(*---
description: colon_greater of function_strings, a FcnRcdValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_strings__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ([a |-> "a", b |-> "b"] :> FALSE)'
---*)
