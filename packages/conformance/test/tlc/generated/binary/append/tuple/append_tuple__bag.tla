(*---
description: append of tuple, a TupleValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, <<1>>>>"
---*)
