(*---
description: "CHOOSE over an interval and over the equal enumeration picks the same element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_interval ----
EXTENDS Integers
Test == (CHOOSE x \in 1..3 : x > 1) = (CHOOSE y \in {3, 2, 1} : y > 1)
====

(*--- recorded
all:
  exit: 0
---*)
