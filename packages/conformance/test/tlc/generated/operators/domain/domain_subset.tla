(*---
description: domain applied to subset, a SubsetValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN SUBSET {1, 2})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_subset failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form SUBSET S)
    line 14, col 16 to line 14, col 35 of module domain_subset
---*)
