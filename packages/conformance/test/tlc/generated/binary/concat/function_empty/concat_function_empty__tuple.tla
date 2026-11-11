(*---
description: concat of function_empty, a FcnRcdValue, and tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \o (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
