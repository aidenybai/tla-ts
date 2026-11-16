(*---
description: "A function record compared with a record of another size is FALSE at once."
ref: "tlc2/value/impl/FcnRcdValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE integer_function_lhs_record_different_size ----
EXTENDS Integers, TLC
Test == (1 :> 1) # [a |-> 1, b |-> 2]
====

(*--- recorded
all:
  exit: 0
---*)
