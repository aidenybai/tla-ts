(*---
description: colon_greater of true, a BoolValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (TRUE :> "")'
---*)
