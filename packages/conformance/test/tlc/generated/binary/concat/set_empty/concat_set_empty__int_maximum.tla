(*---
description: concat of set_empty, a SetEnumValue, and int_maximum, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_empty__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \o (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
---*)
