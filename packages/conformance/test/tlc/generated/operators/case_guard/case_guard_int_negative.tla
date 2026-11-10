(*---
description: case_guard applied to int_negative, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_case
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE case_guard_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE -3 -> 1 [] OTHER -> 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module case_guard_int_negative failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 21 to line 14, col 22 of module case_guard_int_negative
---*)
