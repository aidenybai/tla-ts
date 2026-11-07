(*---
description: "Membership checks each field set."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_record ----
EXTENDS Integers
Test == [a |-> 1] \in [a : {1}] /\ [a |-> 2] \notin [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
