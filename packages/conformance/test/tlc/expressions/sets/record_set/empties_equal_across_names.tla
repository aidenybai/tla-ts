(*---
description: "Two empty sets of records are equal whatever their fields are."
ref: "tlc2/value/impl/SetOfRcdsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE empties_equal_across_names ----
EXTENDS Integers
Test == [a : {}] = [b : {}]
====

(*--- recorded
all:
  exit: 0
---*)
