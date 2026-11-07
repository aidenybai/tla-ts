(*---
description: colon_greater of interval_empty, a IntervalValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> STRING)"
---*)
