(*---
description: except_key applied to function_empty, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_key_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<1, 2>> EXCEPT ![[x \in {} |-> x]] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_key_function_empty failed.
    Attempted to access tuple at a non integral index: <<>>
---*)
