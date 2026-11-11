(*---
description: "\\E over the empty set is FALSE and never evaluates its body."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: success
---*)
---- MODULE exists_empty_skips_body_error ----
EXTENDS Integers
Test == ~\E x \in {} : 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
