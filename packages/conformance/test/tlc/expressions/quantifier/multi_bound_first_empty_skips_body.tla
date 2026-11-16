(*---
description: "An empty first bound ends the enumeration before the body ever runs."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE multi_bound_first_empty_skips_body ----
EXTENDS Integers
Test == ~\E x \in {}, y \in 1..2 : 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
