(*---
description: domain applied to int_zero, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN 0)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_int_zero failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 16 to line 14, col 23 of module domain_int_zero
---*)
