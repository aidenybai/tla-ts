(*---
description: subseteq of interval_empty, a IntervalValue, and model_value, a ModelValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE subseteq_interval_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((3..1) \subseteq (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
