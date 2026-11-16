(*---
description: "DOMAIN of a function on an enumerated set is the normalized set."
ref: "tlc2/value/impl/FcnRcdValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_enum_function ----
EXTENDS Integers
Test == DOMAIN [x \in {2, 1} |-> 0] = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
