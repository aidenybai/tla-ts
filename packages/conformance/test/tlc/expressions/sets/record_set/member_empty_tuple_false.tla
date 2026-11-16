(*---
description: "The empty tuple converts to the empty record, which lacks the fields."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_empty_tuple_false ----
EXTENDS Integers
Test == <<>> \notin [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
