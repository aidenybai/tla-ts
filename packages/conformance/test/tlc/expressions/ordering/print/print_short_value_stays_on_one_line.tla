(*---
description: "A value at most 80 columns wide prints on one line."
ref: "tlc2/value/Values.java#ppr"
flags: [expression]
outcome: success
---*)
---- MODULE print_short_value_stays_on_one_line ----
EXTENDS Integers, TLC
Test == PrintT(1..20)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1..20"
---*)
