(*---
description: subseteq_left applied to set_cup, a SetCupValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \cup {2} \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
