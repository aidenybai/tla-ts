(*---
description: equiv applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_equiv
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equiv_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1, 2} |-> x * 2] <=> TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equiv_function failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 16 to line 14, col 48 of module equiv_function
---*)
