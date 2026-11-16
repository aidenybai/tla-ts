(*---
description: "Normalized order compares sets by size first."
ref: "tlc2/value/impl/SetEnumValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE smaller_set_before_larger ----
EXTENDS Integers
Test == (CHOOSE x \in {{1, 2}, {3}} : TRUE) = {3}
====

(*--- recorded
all:
  exit: 0
---*)
