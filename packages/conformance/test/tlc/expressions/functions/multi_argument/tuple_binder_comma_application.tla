(*---
description: "A function with a tuple binder also accepts a comma application."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_comma_application ----
EXTENDS Integers
Test == [<<a, b>> \in {<<1, 2>>} |-> a + b][1, 2] = 3
====

(*--- recorded
all:
  exit: 0
---*)
