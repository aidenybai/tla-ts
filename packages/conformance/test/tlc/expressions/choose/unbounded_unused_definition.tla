(*---
description: "An unbounded CHOOSE in a definition that nothing uses produces no error at the use site."
ref: "tlc2/tool/impl/Tool.java#OPCODE_uc"
flags: [expression]
outcome: success
---*)
---- MODULE unbounded_unused_definition ----
EXTENDS Integers
F(z) == CHOOSE v : v \notin z
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
