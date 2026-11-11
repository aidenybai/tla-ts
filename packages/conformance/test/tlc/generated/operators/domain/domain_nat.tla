(*---
description: domain applied to nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN Nat)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_nat failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a special set constant)
    line 14, col 16 to line 14, col 25 of module domain_nat
---*)
