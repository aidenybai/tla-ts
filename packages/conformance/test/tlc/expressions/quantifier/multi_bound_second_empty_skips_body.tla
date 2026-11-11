(*---
description: "A later empty bound ends the enumeration before the body ever runs."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE multi_bound_second_empty_skips_body ----
EXTENDS Integers
Test == \A x \in 1..2, y \in {} : 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
