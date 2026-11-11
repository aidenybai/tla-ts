(*---
description: append of bag, a FcnRcdValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, Seq({1})>>"
---*)
