(*---
description: and_left applied to string_escapes, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a\"b\\c\n" /\ TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_left_string_escapes failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a string.
    line 14, col 16 to line 14, col 34 of module and_left_string_escapes
---*)
