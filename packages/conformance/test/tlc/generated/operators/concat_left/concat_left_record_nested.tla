(*---
description: concat_left applied to record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b |-> <<1>>]] \o <<9>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_left_record_nested failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> [b |-> <<1>>]]
---*)
