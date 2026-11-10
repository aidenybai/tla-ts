(*---
description: "A string found in the smaller member set never reaches the interval, which would reject it."
ref: "tlc2/value/impl/UnionValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_member_smaller_set_answers ----
EXTENDS Integers
Test == "a" \in UNION {1..2, {"a"}}
====

(*--- recorded
all:
  exit: 0
---*)
