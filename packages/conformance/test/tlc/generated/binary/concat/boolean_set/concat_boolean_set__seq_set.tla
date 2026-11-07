(*---
description: concat of boolean_set, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_boolean_set__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \o (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {FALSE, TRUE}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {FALSE, TRUE}
---*)
