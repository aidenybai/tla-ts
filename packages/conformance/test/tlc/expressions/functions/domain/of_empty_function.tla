(*---
description: "DOMAIN of an empty function is empty."
ref: "tlc2/value/impl/FcnRcdValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE of_empty_function ----
EXTENDS Integers
Test == DOMAIN [x \in {} |-> 1] = {}
====

(*--- recorded
all:
  exit: 0
---*)
