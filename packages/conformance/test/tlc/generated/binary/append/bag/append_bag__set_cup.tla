(*---
description: append of bag, a FcnRcdValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), {1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {1, 2}>>"
---*)
