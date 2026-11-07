(*---
description: concat of int_maximum, a IntValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_maximum__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \o (Int))
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
