(*---
description: subseteq of cross, a SetOfTuplesValue, and seq_set, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_cross__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \subseteq (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
