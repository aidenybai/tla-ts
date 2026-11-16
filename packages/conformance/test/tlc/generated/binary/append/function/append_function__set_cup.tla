(*---
description: append of function, a FcnRcdValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], {1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, {1, 2}>>"
---*)
