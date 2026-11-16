(*---
description: "DOMAIN of a tuple is 1..Len."
ref: "tlc2/value/impl/TupleValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_tuple ----
EXTENDS Integers
Test == DOMAIN <<7, 8>> = 1..2 /\ DOMAIN <<7, 8>> = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
