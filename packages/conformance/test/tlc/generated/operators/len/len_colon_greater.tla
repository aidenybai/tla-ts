(*---
description: len applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
