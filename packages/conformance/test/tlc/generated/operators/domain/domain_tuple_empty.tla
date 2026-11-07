(*---
description: domain applied to tuple_empty, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN <<>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
