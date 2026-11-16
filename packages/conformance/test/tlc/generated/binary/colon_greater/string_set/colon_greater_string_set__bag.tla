(*---
description: colon_greater of string_set, a UserValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> <<1>>)"
---*)
