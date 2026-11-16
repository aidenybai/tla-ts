(*---
description: colon_greater of interval, a IntervalValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> -3)"
---*)
