(*---
description: append_to applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_to_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 9>>"
---*)
