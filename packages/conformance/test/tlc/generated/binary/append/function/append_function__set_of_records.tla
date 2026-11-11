(*---
description: append of function, a FcnRcdValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], [a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, {[a |-> 1], [a |-> 2]}>>"
---*)
