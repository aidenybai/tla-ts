(*---
description: colon_greater of false, a BoolValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (FALSE :> "a")'
---*)
