(*---
description: subseteq of set_diff, a SetDiffValue, and set_mixed, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_diff__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \subseteq ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
