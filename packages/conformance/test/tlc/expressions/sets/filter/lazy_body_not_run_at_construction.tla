(*---
description: "A filter over Nat is not evaluated when built, so an erroring predicate is harmless if never consulted."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_body_not_run_at_construction ----
EXTENDS Integers
S == {x \in Nat : 1 \div 0 = 0}
Test == -1 \notin S
====

(*--- recorded
all:
  exit: 0
---*)
