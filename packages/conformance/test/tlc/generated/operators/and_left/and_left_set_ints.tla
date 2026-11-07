(*---
description: and_left applied to set_ints, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({2, 1} /\ TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_left_set_ints failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 16 to line 14, col 29 of module and_left_set_ints
---*)
