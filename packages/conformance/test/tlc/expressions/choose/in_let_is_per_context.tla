(*---
description: "A CHOOSE in LET picks using the values bound in its context."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE in_let_is_per_context ----
EXTENDS Integers
Test == \A k \in 1..2 : LET c == CHOOSE x \in 1..3 : x > k IN c = k + 1
====

(*--- recorded
all:
  exit: 0
---*)
