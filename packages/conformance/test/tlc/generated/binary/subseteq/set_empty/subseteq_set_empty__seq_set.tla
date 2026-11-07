(*---
description: subseteq of set_empty, a SetEnumValue, and seq_set, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
