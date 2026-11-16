(*---
description: colon_greater of colon_greater, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> TRUE)"
---*)
