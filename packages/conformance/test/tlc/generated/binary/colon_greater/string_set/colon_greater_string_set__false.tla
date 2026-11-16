(*---
description: colon_greater of string_set, a UserValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> FALSE)"
---*)
