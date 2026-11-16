(*---
description: "![a, b] and ![<<a, b>>] are the same path."
ref: "tlc2/value/impl/FcnRcdValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE comma_path_equals_tuple_path ----
EXTENDS Integers
F == [x, y \in 1..2 |-> 0]
Test == [F EXCEPT ![1, 2] = 9] = [F EXCEPT ![<<1, 2>>] = 9]
====

(*--- recorded
all:
  exit: 0
---*)
