(*---
description: append of bag, a FcnRcdValue, and string_a, a StringValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), "a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a">>'
---*)
