(*---
description: "DOMAIN of a function on an interval is that interval, whatever its low bound."
ref: "tlc2/value/impl/FcnRcdValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_interval_function ----
EXTENDS Integers
Test == DOMAIN [x \in 3..4 |-> 0] = 3..4
====

(*--- recorded
all:
  exit: 0
---*)
