(*---
description: "A lazy filter over a lazy filter chains its membership checks."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_of_lazy ----
EXTENDS Integers
Test == 2 \in {x \in {y \in Nat : y > 1} : x < 3} /\ 3 \notin {x \in {y \in Nat : y > 1} : x < 3}
====

(*--- recorded
all:
  exit: 0
---*)
