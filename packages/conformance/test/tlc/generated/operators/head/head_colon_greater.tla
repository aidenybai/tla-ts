(*---
description: head applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
