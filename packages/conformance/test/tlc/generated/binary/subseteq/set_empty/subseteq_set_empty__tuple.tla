(*---
description: subseteq of set_empty, a SetEnumValue, and tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
