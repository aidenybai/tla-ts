(*---
description: domain applied to union, a UnionValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN UNION {{1}, {2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_union failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form {e1, ... ,eN})
    line 14, col 16 to line 14, col 38 of module domain_union
---*)
