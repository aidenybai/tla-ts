(*---
description: colon_greater of int_zero, a IntValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> STRING)"
---*)
