(*---
description: concat of function, a FcnRcdValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) \o (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<2, 4, 1, "a", {TRUE}>>'
---*)
