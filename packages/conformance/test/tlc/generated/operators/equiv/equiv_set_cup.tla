(*---
description: equiv applied to set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_equiv
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equiv_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \cup {2} <=> TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equiv_set_cup failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 16 to line 14, col 36 of module equiv_set_cup
---*)
