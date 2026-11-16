(*---
description: "A set map destructures a tuple binder."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder ----
EXTENDS Integers
Test == {a + b : <<a, b>> \in {<<1, 2>>, <<3, 4>>}} = {3, 7}
====

(*--- recorded
all:
  exit: 0
---*)
