(*---
description: "A set of integers prints ascending."
ref: "tlc2/value/impl/SetEnumValue.java#normalize"
flags: [expression]
outcome: success
---*)
---- MODULE integers_ascending ----
EXTENDS Integers, TLC
Test == PrintT({3, -1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1, 2, 3}"
---*)
