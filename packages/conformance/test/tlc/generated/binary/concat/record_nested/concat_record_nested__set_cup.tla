(*---
description: concat of record_nested, a RecordValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_record_nested__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> [b |-> <<1>>]]) \o ({1} \cup {2}))
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
