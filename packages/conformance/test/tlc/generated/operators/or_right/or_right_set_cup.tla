(*---
description: or_right applied to set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ {1} \cup {2})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_right_set_cup failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 16 to line 14, col 36 of module or_right_set_cup
---*)
