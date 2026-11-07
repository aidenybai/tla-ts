(*---
description: except_field applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[x \in {1, 2} |-> x * 2] EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_field_function failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
