(*---
description: "A later clause sees the result of earlier clauses through @."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE at_sees_prior_clause ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![1] = @ + 1, ![1] = @ * 5] = <<10>>
====

(*--- recorded
all:
  exit: 0
---*)
