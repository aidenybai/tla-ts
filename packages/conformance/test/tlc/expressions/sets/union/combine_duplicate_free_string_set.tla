(*---
description: "UNION of enumerated sets of strings keeps each string once."
ref: "tlc2/value/impl/UnionValue.java#union"
flags: [expression]
outcome: success
---*)
---- MODULE combine_duplicate_free_string_set ----
EXTENDS Integers
Test == UNION {{"a"}, {"a", "b"}} = {"a", "b"}
====

(*--- recorded
all:
  exit: 0
---*)
