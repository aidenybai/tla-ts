(*---
description: "CHOOSE with the same set and predicate always returns the same value."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE deterministic_repeated ----
EXTENDS Integers
Test == (CHOOSE x \in {1, 2} : TRUE) = (CHOOSE x \in {2, 1} : TRUE)
====

(*--- recorded
all:
  exit: 0
---*)
