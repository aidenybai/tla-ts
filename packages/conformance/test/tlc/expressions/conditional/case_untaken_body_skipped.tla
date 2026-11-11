(*---
description: "CASE does not evaluate the body of a false guard."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_untaken_body_skipped ----
EXTENDS Integers
Test == (CASE FALSE -> 1 \div 0 [] TRUE -> 2) = 2
====

(*--- recorded
all:
  exit: 0
---*)
