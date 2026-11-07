(*---
description: concat of interval, a IntervalValue, and set_diff, a SetDiffValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_interval__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \o ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1..3
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1..3
---*)
