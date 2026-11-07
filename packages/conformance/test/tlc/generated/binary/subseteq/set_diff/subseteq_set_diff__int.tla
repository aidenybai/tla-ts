(*---
description: subseteq of set_diff, a SetDiffValue, and int, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_diff__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \subseteq (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
