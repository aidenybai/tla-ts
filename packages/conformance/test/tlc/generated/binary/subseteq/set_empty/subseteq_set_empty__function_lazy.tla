(*---
description: subseteq of set_empty, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
