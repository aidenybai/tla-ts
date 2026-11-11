(*---
description: append of bag, a FcnRcdValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), [a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, [a |-> 1, b |-> 2]>>"
---*)
