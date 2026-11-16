(*---
description: append of function, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], (-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, -2147483648>>"
---*)
