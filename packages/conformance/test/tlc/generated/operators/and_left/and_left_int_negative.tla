(*---
description: and_left applied to int_negative, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-3 /\ TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_left_int_negative failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    an integer.
    line 14, col 16 to line 14, col 25 of module and_left_int_negative
---*)
