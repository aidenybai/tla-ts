(*---
description: "A recursive operator can build nested records."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rc"
flags: [expression]
outcome: success
---*)
---- MODULE recursion_builds_record ----
EXTENDS Integers
RECURSIVE Nest(_)
Nest(n) == IF n = 0 THEN [leaf |-> TRUE] ELSE [child |-> Nest(n - 1)]
Test == Nest(2).child.child.leaf
====

(*--- recorded
all:
  exit: 0
---*)
