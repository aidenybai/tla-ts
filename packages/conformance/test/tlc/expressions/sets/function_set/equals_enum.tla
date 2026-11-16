(*---
description: "A function set equals the enumerated set of its functions."
ref: "tlc2/value/impl/SetOfFcnsValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_enum ----
EXTENDS Integers
Test == [{1} -> {2, 3}] = {<<2>>, <<3>>}
====

(*--- recorded
all:
  exit: 0
---*)
