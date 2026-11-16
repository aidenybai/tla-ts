(*---
description: "DOMAIN of the empty tuple is empty."
ref: "tlc2/value/impl/TupleValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_empty_tuple ----
EXTENDS Integers
Test == DOMAIN <<>> = {}
====

(*--- recorded
all:
  exit: 0
---*)
