(*---
description: append of bag, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), [x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, <<>>>>"
---*)
