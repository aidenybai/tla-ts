(*---
description: domain applied to function, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [x \in {1, 2} |-> x * 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
