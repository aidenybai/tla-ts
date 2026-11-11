(*---
description: "Nested application reads a tuple of tuples."
ref: "tlc2/value/impl/TupleValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE function_of_tuples_as_matrix ----
EXTENDS Integers
Test == <<<<1, 2>>, <<3, 4>>>>[2][1] = 3
====

(*--- recorded
all:
  exit: 0
---*)
