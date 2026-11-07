(*---
description: concat of subset, a SubsetValue, and function, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_subset__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \o ([x \in {1, 2} |-> x * 2]))
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
