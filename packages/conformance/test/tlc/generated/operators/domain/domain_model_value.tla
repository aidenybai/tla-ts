(*---
description: domain applied to model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE domain_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(DOMAIN mv)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module domain_model_value failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a model value)
    line 17, col 16 to line 17, col 24 of module domain_model_value
---*)
