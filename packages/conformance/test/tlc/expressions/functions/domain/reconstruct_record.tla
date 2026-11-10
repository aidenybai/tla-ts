(*---
description: "Rebuilding a record from its domain gives an equal record."
ref: "tlc2/tool/impl/Tool.java#OPCODE_domain"
flags: [expression]
outcome: success
---*)
---- MODULE reconstruct_record ----
EXTENDS Integers
Test == LET f == [a |-> 7] IN [x \in DOMAIN f |-> f[x]] = f
====

(*--- recorded
all:
  exit: 0
---*)
