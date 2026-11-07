(*---
description: append of function_empty, a FcnRcdValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<FALSE>>"
---*)
