(*---
description: concat of subset, a SubsetValue, and set_nested, a SetEnumValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_subset__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \o ({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_subset__set_nested failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
---*)
