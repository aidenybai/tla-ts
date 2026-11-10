(*---
description: "UNION SUBSET S equals S."
ref: "tlc2/value/impl/UnionValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE of_subset_is_base ----
EXTENDS Integers
Test == UNION SUBSET {1, 2} = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
