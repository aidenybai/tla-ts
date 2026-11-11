(*---
description: domain applied to tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN <<1, 2>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..2"
---*)
