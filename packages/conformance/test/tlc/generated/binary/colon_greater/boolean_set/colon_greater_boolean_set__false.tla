(*---
description: colon_greater of boolean_set, a SetEnumValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> FALSE)"
---*)
