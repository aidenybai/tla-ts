(*---
description: not applied to string_empty, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(""))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_string_empty failed.
    Attempted to apply the operator ~ to a non-boolean
    (a string)
    line 14, col 16 to line 14, col 20 of module not_string_empty
---*)
