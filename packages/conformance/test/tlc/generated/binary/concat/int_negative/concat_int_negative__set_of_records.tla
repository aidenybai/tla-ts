(*---
description: concat of int_negative, a IntValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_negative__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \o ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -3
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -3
---*)
