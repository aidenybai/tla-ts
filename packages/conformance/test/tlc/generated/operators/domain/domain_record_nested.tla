(*---
description: domain applied to record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_domain
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE domain_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [a |-> [b |-> <<1>>]])
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"a"}'
---*)
