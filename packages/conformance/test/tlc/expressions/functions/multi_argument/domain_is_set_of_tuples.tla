(*---
description: "DOMAIN of a two-bound function over intervals is a set of pairs."
ref: "tlc2/value/impl/FcnRcdValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE domain_is_set_of_tuples ----
EXTENDS Integers
Test == DOMAIN [x \in 1..2, y \in {"a"} |-> 0] = {<<1, "a">>, <<2, "a">>}
====

(*--- recorded
all:
  exit: 0
---*)
