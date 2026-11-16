(*---
description: or_left applied to string_a, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_left_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a" \/ FALSE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_left_string_a failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a string.
    line 14, col 16 to line 14, col 27 of module or_left_string_a
---*)
