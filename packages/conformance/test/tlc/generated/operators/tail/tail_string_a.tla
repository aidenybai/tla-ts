(*---
description: tail applied to string_a, a StringValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ""'
---*)
