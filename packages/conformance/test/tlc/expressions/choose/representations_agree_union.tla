(*---
description: "CHOOSE over UNION picks the smallest merged element even when another set comes first."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_union ----
EXTENDS Integers
Test == (CHOOSE x \in UNION {3..4, {1}} : TRUE) = 1
====

(*--- recorded
all:
  exit: 0
---*)
