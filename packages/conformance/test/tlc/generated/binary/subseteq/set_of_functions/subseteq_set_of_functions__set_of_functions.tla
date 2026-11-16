(*---
description: subseteq of set_of_functions, a SetOfFcnsValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_of_functions__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \subseteq ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
