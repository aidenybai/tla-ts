(*---
description: "Membership checks each component against its set."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_tuple ----
EXTENDS Integers
Test == <<1, "a">> \in {1, 2} \X {"a"} /\ <<3, "a">> \notin {1, 2} \X {"a"}
====

(*--- recorded
all:
  exit: 0
---*)
