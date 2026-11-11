(*---
description: head applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
