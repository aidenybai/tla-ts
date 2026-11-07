(*---
description: except_field applied to function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[x \in Nat |-> x] EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
