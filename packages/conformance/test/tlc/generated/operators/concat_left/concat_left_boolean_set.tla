(*---
description: concat_left applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BOOLEAN \o <<9>>)
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
