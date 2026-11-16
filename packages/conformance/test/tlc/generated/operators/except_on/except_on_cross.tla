(*---
description: except_on applied to cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1, 2} \X {3} EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_on_cross failed.
    Attempted to apply EXCEPT construct to the value {<<1, 3>>, <<2, 3>>}.
---*)
