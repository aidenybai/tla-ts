(*---
description: "Sets sort by size before elements."
ref: "tlc2/value/impl/SetEnumValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE sets_by_size ----
EXTENDS Integers, TLC
Test == PrintT({{5, 6}, {9}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{9}, {5, 6}}"
---*)
