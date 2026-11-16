(*---
description: domain applied to record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [a |-> 1, b |-> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a", "b"}'
---*)
