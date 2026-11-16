(*---
description: "[a : S] equals [{\"a\"} -> S] across representations."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_function_set ----
EXTENDS Integers
Test == [a : {1, 2}] = [{"a"} -> {1, 2}]
====

(*--- recorded
all:
  exit: 0
---*)
