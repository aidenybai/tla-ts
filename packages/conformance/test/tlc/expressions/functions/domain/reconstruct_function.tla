(*---
description: "[x \\in DOMAIN f |-> f[x]] equals f across representations."
ref: "tlc2/tool/impl/Tool.java#OPCODE_domain"
flags: [expression]
outcome: success
---*)
---- MODULE reconstruct_function ----
EXTENDS Integers
Test == LET f == <<7, 8>> IN [x \in DOMAIN f |-> f[x]] = f
====

(*--- recorded
all:
  exit: 0
---*)
