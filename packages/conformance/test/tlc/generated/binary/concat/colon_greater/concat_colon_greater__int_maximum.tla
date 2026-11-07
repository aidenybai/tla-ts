(*---
description: concat of colon_greater, a FcnRcdValue, and int_maximum, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_colon_greater__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) \o (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    2147483647
---*)
