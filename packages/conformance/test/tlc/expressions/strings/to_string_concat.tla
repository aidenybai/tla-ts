(*---
description: "The result of ToString is an ordinary string."
ref: "tlc2/module/TLC.java#ToString"
flags: [expression]
outcome: success
---*)
---- MODULE to_string_concat ----
EXTENDS Integers, Sequences, TLC
Test == Len(ToString(12)) = 2 /\ ToString(1) \o "x" = "1x"
====

(*--- recorded
all:
  exit: 0
---*)
