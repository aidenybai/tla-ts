(*---
description: and_left applied to set_cap, a SetCapValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \cap {2, 3} /\ TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_left_set_cap failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 16 to line 14, col 41 of module and_left_set_cap
---*)
