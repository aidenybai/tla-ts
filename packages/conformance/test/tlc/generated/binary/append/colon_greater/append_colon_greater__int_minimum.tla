(*---
description: append of colon_greater, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, (-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, -2147483648>>"
---*)
