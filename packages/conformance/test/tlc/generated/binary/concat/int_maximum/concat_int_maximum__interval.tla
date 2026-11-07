(*---
description: concat of int_maximum, a IntValue, and interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_maximum__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \o (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    2147483647
---*)
