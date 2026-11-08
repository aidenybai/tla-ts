(*---
description: concat of subset, a SubsetValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_subset__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \o ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_subset__function_pair_domain failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {{}, {1}, {2}, {1, 2}}
---*)
