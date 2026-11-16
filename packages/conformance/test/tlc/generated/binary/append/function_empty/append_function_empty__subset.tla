(*---
description: append of function_empty, a FcnRcdValue, and subset, a SubsetValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{{}, {1}, {2}, {1, 2}}>>"
---*)
