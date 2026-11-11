(*---
description: except_on applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[x \in {1, 2} |-> x * 2] EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 4>>"
---*)
