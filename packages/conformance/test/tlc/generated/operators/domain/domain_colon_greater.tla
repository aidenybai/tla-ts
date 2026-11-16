(*---
description: domain applied to colon_greater, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN 1 :> 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module domain_colon_greater failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 16 to line 14, col 23 of module domain_colon_greater
---*)
