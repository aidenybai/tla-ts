(*---
description: concat of seq_set, a UserValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_seq_set__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \o ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Seq({1})
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    Seq({1})
---*)
