(*---
description: "CHOOSE over a filter and over the equal enumeration picks the same element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_filter ----
EXTENDS Integers
Test == (CHOOSE x \in {z \in {5, 4, 3} : z > 3} : TRUE) = (CHOOSE y \in {5, 4} : TRUE)
====

(*--- recorded
all:
  exit: 0
---*)
