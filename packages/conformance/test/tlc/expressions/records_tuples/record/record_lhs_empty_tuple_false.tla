(*---
description: "A record on the left converts the empty tuple to the empty record, so comparing is FALSE with no error."
ref: "tlc2/value/impl/TupleValue.java#toRcd"
flags: [expression]
outcome: success
---*)
---- MODULE record_lhs_empty_tuple_false ----
EXTENDS Integers
Test == [a |-> 1] # <<>>
====

(*--- recorded
all:
  exit: 0
---*)
