(*---
description: "r.a and r[\"a\"] read the same field."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rs"
flags: [expression]
outcome: success
---*)
---- MODULE select_and_apply_agree ----
EXTENDS Integers
Test == [a |-> 1].a = [a |-> 1]["a"]
====

(*--- recorded
all:
  exit: 0
---*)
