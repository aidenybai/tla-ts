(*---
description: "UNION of a set map combines the mapped sets."
ref: "tlc2/value/impl/UnionValue.java#union"
flags: [expression]
outcome: success
---*)
---- MODULE of_function_range ----
EXTENDS Integers
Test == UNION {{x, x + 1} : x \in {1, 3}} = 1..4
====

(*--- recorded
all:
  exit: 0
---*)
