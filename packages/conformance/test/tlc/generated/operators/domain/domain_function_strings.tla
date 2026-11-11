(*---
description: domain applied to function_strings, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [x \in {"a", "b"} |-> x])
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a", "b"}'
---*)
