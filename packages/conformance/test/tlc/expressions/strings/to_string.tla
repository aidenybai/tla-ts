(*---
description: "ToString renders a value as a string, keeping inner quotes."
ref: "tlc2/module/TLC.java#ToString"
flags: [expression]
outcome: success
---*)
---- MODULE to_string ----
EXTENDS Integers, TLC
Test == PrintT(ToString(<<"a", 1>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "<<\"a\", 1>>"'
---*)
