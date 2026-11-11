(*---
description: concat of string_set, a UserValue, and interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) \o (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_string_set__interval failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    STRING
---*)
