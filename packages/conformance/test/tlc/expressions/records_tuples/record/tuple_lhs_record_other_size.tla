(*---
description: "A tuple on the left compared with a record of another size is FALSE, which is the TLA+ answer. With the operands swapped TLC rejects the comparison of different kinds on purpose."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_lhs_record_other_size ----
EXTENDS Integers
Test == <<1, 2>> # [a |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
