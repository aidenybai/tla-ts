(*---
description: "Sets of equal size sort by their elements."
ref: "tlc2/value/impl/SetEnumValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE sets_same_size_by_elements ----
EXTENDS Integers, TLC
Test == PrintT({{1, 3}, {1, 2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{1, 2}, {1, 3}}"
---*)
