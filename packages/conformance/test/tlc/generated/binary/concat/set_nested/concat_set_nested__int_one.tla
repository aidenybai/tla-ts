(*---
description: concat of set_nested, a SetEnumValue, and int_one, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_nested__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \o (1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}}
---*)
