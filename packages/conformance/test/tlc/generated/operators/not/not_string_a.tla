(*---
description: not applied to string_a, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~("a"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_string_a failed.
    Attempted to apply the operator ~ to a non-boolean
    (a string)
    line 14, col 16 to line 14, col 21 of module not_string_a
---*)
