(*---
description: colon_greater of true, a BoolValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> STRING)"
---*)
