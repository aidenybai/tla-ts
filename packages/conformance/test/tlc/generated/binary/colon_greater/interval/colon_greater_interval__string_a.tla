(*---
description: colon_greater of interval, a IntervalValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (1..3 :> "a")'
---*)
