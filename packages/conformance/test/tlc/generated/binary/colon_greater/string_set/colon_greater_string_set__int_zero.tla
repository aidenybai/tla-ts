(*---
description: colon_greater of string_set, a UserValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> 0)"
---*)
