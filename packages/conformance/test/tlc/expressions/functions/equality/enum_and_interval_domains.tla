(*---
description: "Functions over an enumerated set and the equal interval are equal."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE enum_and_interval_domains ----
EXTENDS Integers
Test == [x \in {1, 2} |-> x] = [x \in 1..2 |-> x]
====

(*--- recorded
all:
  exit: 0
---*)
