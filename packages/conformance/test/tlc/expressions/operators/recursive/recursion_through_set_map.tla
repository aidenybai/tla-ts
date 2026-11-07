(*---
description: "Recursion through a set map computes all branches."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE recursion_through_set_map ----
EXTENDS Integers, Sequences, FiniteSets
RECURSIVE Paths(_)
Paths(n) == IF n = 0 THEN {<<>>} ELSE {<<b>> \o p : b \in {0, 1}, p \in Paths(n - 1)}
Test == Cardinality(Paths(3)) = 8
====

(*--- recorded
all:
  exit: 0
---*)
