(*---
description: concat of set_of_records, a SetOfRcdsValue, and int, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_of_records__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \o (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_set_of_records__int failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
