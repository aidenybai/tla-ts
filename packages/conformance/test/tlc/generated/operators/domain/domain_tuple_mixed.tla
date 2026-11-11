(*---
description: domain applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN <<1, "a", {TRUE}>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..3"
---*)
