(*---
description: concat of subset, a SubsetValue, and record, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_subset__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \o ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
---*)
