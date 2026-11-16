(*---
description: append of function_empty, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<1>>>>"
---*)
