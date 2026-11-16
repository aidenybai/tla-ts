(*---
description: append of function_empty, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<TRUE>>"
---*)
