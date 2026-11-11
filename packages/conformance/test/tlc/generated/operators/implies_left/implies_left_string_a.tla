(*---
description: implies_left applied to string_a, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_left_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a" => TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module implies_left_string_a failed.
    Attempted to evaluate an expression of form P => Q when P was
    a string.
    line 14, col 16 to line 14, col 26 of module implies_left_string_a
---*)
