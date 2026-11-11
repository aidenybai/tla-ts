(*---
description: "Checking a string against an empty interval is FALSE, because the type check only runs when low is at most high."
ref: "tlc2/value/impl/IntervalValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_non_integer_when_empty ----
EXTENDS Integers
Test == "a" \notin 2..1
====

(*--- recorded
all:
  exit: 0
---*)
