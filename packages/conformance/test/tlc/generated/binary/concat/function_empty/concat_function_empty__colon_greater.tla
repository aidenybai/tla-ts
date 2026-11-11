(*---
description: concat of function_empty, a FcnRcdValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_empty__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \o (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
