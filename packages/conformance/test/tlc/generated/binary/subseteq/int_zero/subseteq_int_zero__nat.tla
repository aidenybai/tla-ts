(*---
description: subseteq of int_zero, a IntValue, and nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_int_zero__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \subseteq (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_int_zero__nat failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 16 to line 14, col 34 of module subseteq_int_zero__nat
---*)
