(*---
description: concat of set_of_records, a SetOfRcdsValue, and set_empty, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_of_records__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \o ({}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_set_of_records__set_empty failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
