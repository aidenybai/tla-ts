(*---
description: domain applied to false, a BoolValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN FALSE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_false failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 16 to line 14, col 27 of module domain_false
---*)
