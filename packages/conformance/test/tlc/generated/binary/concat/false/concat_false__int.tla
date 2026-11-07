(*---
description: concat of false, a BoolValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_false__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) \o (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    FALSE
---*)
