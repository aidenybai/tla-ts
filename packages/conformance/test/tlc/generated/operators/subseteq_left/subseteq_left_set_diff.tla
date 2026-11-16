(*---
description: subseteq_left applied to set_diff, a SetDiffValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ {2} \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
