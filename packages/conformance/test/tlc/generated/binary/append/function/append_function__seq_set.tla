(*---
description: append of function, a FcnRcdValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, Seq({1})>>"
---*)
