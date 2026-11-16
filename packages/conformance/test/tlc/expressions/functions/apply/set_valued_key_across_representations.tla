(*---
description: "A set-valued key is found through an equal value in another representation."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE set_valued_key_across_representations ----
EXTENDS Integers
F == [s \in {{1, 2}} |-> 7]
Test == F[1..2] = 7 /\ F[{2, 1}] = 7
====

(*--- recorded
all:
  exit: 0
---*)
