(*---
description: subseteq of set_empty, a SetEnumValue, and set_mixed, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_empty__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \subseteq ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
