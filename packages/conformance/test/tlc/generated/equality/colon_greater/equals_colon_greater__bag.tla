(*---
description: Compares colon_greater, a FcnRcdValue, with bag, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_colon_greater__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) = (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
