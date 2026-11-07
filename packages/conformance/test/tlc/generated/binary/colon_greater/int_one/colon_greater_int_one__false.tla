(*---
description: colon_greater of int_one, a IntValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<FALSE>>"
---*)
