(*---
description: colon_greater of interval_empty, a IntervalValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({} :> "")'
---*)
