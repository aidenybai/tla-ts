(*---
description: "\\E stops at the first witness, so a later non-Boolean body value is not seen."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: success
---*)
---- MODULE exists_stops_before_non_boolean ----
EXTENDS Integers
Test == \E x \in 1..2 : IF x = 1 THEN TRUE ELSE 7
====

(*--- recorded
all:
  exit: 0
---*)
