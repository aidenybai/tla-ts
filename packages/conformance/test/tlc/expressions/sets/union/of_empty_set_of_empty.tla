(*---
description: "UNION {{}} is {}."
ref: "tlc2/value/impl/UnionValue.java#union"
flags: [expression]
outcome: success
---*)
---- MODULE of_empty_set_of_empty ----
EXTENDS Integers
Test == UNION {{}} = {}
====

(*--- recorded
all:
  exit: 0
---*)
