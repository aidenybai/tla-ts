(*---
description: tail applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
