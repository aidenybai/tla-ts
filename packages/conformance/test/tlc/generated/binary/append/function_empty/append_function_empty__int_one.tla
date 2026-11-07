(*---
description: append of function_empty, a FcnRcdValue, and int_one, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function_empty__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {} |-> x], 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
