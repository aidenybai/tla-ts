(*---
description: colon_greater of boolean_set, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> <<1>>)"
---*)
