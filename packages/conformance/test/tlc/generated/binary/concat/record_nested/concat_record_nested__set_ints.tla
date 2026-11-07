(*---
description: concat of record_nested, a RecordValue, and set_ints, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_record_nested__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \o ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> [b |-> <<1>>]]
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> [b |-> <<1>>]]
---*)
