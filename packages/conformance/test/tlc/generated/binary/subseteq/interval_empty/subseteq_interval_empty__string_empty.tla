(*---
description: subseteq of interval_empty, a IntervalValue, and string_empty, a StringValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \subseteq (""))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
