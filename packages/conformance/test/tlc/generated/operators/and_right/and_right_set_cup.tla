(*---
description: and_right applied to set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ {1} \cup {2})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_right_set_cup failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 16 to line 14, col 35 of module and_right_set_cup
---*)
