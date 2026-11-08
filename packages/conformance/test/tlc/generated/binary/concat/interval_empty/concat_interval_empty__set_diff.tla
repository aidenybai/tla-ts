(*---
description: concat of interval_empty, a IntervalValue, and set_diff, a SetDiffValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_interval_empty__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \o ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_interval_empty__set_diff failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
---*)
