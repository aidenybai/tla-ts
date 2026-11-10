(*---
description: colon_greater of int_zero, a IntValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (0 :> "a")'
---*)
