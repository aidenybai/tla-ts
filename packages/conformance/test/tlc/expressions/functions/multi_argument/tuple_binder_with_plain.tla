(*---
description: "A tuple binder and a plain bound take a nested first argument."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_with_plain ----
EXTENDS Integers
Test == [<<a, b>> \in {<<1, 2>>}, c \in {3} |-> a + b + c][<<1, 2>>, 3] = 6
====

(*--- recorded
all:
  exit: 0
---*)
