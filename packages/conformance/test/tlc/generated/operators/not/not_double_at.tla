(*---
description: not applied to double_at, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_double_at failed.
    Attempted to apply the operator ~ to a non-boolean
    (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))
    line 14, col 16 to line 14, col 38 of module not_double_at
---*)
