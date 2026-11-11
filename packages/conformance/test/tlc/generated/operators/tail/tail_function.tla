(*---
description: tail applied to function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<4>>"
---*)
