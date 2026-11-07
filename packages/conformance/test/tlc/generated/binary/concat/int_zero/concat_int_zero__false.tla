(*---
description: concat of int_zero, a IntValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_zero__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \o (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    0
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    0
---*)
