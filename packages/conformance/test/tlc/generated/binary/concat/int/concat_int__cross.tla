(*---
description: concat of int, a UserValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \o ({1, 2} \X {3}))
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
