(*---
description: colon_greater of int, a UserValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> STRING)"
---*)
