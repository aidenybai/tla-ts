(*---
description: colon_greater of string_set, a UserValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> 2147483647)"
---*)
