(*---
description: "A tuple-valued key is found through an equal function."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_key_across_representations ----
EXTENDS Integers
F == [t \in {<<1, 2>>} |-> 7]
Test == F[[i \in 1..2 |-> i]] = 7
====

(*--- recorded
all:
  exit: 0
---*)
