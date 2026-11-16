(*---
description: "BOOLEAN is the enumerated set {FALSE, TRUE}, and its quantifier visits both values."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE boolean_set_member ----
EXTENDS Integers, FiniteSets
Test == (\A b \in BOOLEAN : b \/ ~b) /\ Cardinality(BOOLEAN) = 2
====

(*--- recorded
all:
  exit: 0
---*)
