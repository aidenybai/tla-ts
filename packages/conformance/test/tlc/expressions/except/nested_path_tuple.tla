(*---
description: "A nested path updates one inner component."
ref: "tlc2/value/impl/TupleValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE nested_path_tuple ----
EXTENDS Integers
Test == [<<<<1, 2>>, 3>> EXCEPT ![1][2] = 9] = <<<<1, 9>>, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
