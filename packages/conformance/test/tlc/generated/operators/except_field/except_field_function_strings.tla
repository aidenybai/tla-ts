(*---
description: except_field applied to function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[x \in {"a", "b"} |-> x] EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> 9, b |-> "b"]'
---*)
