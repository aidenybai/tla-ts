(*---
description: "In a /\\ b /\\ c, a FALSE a skips both b and c."
ref: "tlc2/tool/impl/Tool.java#OPCODE_land"
flags: [expression]
outcome: success
---*)
---- MODULE and_is_right_associative_short_circuit ----
EXTENDS Integers
Test == (FALSE /\ 7 /\ 8) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
