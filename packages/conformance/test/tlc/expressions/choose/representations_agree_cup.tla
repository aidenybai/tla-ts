(*---
description: "CHOOSE over a lazy union and over the equal enumeration picks the same element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_cup ----
EXTENDS Integers
Test == (CHOOSE x \in (2..3) \cup {1} : TRUE) = 1
====

(*--- recorded
all:
  exit: 0
---*)
