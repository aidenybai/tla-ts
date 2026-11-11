(*---
description: "CHOOSE over \\cap picks the smallest common element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_cap ----
EXTENDS Integers
Test == (CHOOSE x \in {3, 2} \cap (1..3) : TRUE) = 2
====

(*--- recorded
all:
  exit: 0
---*)
