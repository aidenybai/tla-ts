(*---
description: "![a, b] updates a two-argument function."
ref: "tlc2/value/impl/FcnRcdValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE comma_path_on_pair_function ----
EXTENDS Integers
F == [x, y \in 1..2 |-> 0]
Test == [F EXCEPT ![1, 2] = 9][1, 2] = 9
====

(*--- recorded
all:
  exit: 0
---*)
