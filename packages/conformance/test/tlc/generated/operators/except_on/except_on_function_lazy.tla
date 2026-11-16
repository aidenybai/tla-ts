(*---
description: except_on applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[x \in Nat |-> x] EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [x \\in Nat |-> <expression line 14, col 32 to line 14, col 32 of module except_on_function_lazy>]"
---*)
