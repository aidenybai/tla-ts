(*---
description: len applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
