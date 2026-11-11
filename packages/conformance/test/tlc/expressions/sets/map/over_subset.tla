(*---
description: "A set map over SUBSET S enumerates the power set."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE over_subset ----
EXTENDS Integers, FiniteSets
Test == {Cardinality(s) : s \in SUBSET {1, 2}} = {0, 1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
