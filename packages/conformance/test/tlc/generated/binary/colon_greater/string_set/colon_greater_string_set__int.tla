(*---
description: colon_greater of string_set, a UserValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> Int)"
---*)
