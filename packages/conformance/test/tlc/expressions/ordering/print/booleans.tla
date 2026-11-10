(*---
description: "FALSE sorts before TRUE."
ref: "tlc2/value/impl/BoolValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE booleans ----
EXTENDS Integers, TLC
Test == PrintT({TRUE, FALSE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {FALSE, TRUE}"
---*)
