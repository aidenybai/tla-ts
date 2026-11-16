(*---
description: append_to applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_to_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, 9>>"
---*)
