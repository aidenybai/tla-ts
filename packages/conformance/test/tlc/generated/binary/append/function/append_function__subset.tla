(*---
description: append of function, a FcnRcdValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, {{}, {1}, {2}, {1, 2}}>>"
---*)
