(*---
description: concat of int, a UserValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \o (SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Int
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Int
---*)
