(*---
description: colon_greater of true, a BoolValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (TRUE :> "a")'
---*)
