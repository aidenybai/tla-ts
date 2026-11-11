(*---
description: subseteq of double_at, a FcnRcdValue, and int_one, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_double_at__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) \subseteq (1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_double_at__int_one failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 51 of module subseteq_double_at__int_one
---*)
