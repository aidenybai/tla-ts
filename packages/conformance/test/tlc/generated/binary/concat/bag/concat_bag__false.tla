(*---
description: concat of bag, a FcnRcdValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_bag__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \o (FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
