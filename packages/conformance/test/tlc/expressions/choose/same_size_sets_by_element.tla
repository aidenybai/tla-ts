(*---
description: "Normalized order compares same-size sets element by element."
ref: "tlc2/value/impl/SetEnumValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE same_size_sets_by_element ----
EXTENDS Integers
Test == (CHOOSE x \in {{2, 3}, {1, 3}} : TRUE) = {1, 3}
====

(*--- recorded
all:
  exit: 0
---*)
