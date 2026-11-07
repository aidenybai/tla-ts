(*---
description: "A set map collapses equal results."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE deduplicates_results ----
EXTENDS Integers
Test == {x % 2 : x \in 1..5} = {0, 1}
====

(*--- recorded
all:
  exit: 0
---*)
