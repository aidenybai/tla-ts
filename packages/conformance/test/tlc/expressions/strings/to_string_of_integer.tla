(*---
description: "ToString renders an integer."
ref: "tlc2/module/TLC.java#ToString"
flags: [expression]
outcome: success
---*)
---- MODULE to_string_of_integer ----
EXTENDS Integers, TLC
Test == ToString(12) = "12" /\ ToString(-1) = "-1"
====

(*--- recorded
all:
  exit: 0
---*)
