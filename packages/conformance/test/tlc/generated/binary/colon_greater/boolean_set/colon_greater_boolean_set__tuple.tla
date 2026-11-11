(*---
description: colon_greater of boolean_set, a SetEnumValue, and tuple, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> <<1, 2>>)"
---*)
