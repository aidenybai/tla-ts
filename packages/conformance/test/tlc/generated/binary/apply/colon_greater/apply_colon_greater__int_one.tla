(*---
description: apply of colon_greater, a FcnRcdValue, and int_one, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_colon_greater__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2)[1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
