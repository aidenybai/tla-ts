(*---
description: "With the interval as the smaller member set, an integer found in it never reaches the strings."
ref: "tlc2/value/impl/UnionValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_member_interval_first_when_smaller ----
EXTENDS Integers
Test == 1 \in UNION {{"a", "b", "c"}, 1..2}
====

(*--- recorded
all:
  exit: 0
---*)
