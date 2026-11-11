(*---
description: append of colon_greater, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, TRUE>>"
---*)
