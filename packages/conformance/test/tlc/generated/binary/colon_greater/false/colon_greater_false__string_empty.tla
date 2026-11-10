(*---
description: colon_greater of false, a BoolValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (FALSE :> "")'
---*)
