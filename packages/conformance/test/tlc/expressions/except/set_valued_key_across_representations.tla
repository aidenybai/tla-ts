(*---
description: "A set-valued path finds the key through an equal value in another representation."
ref: "tlc2/value/impl/FcnRcdValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE set_valued_key_across_representations ----
EXTENDS Integers
F == [s \in {{1, 2}} |-> 0]
Test == [F EXCEPT ![1..2] = 7][{2, 1}] = 7
====

(*--- recorded
all:
  exit: 0
---*)
