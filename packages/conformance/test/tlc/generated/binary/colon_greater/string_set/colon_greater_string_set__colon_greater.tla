(*---
description: colon_greater of string_set, a UserValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> <<2>>)"
---*)
