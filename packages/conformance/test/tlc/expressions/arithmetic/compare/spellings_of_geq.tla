(*---
description: "\\geq and >= are one operator."
ref: "tlc2/module/Integers.java#GEQ"
flags: [expression]
outcome: success
---*)
---- MODULE spellings_of_geq ----
EXTENDS Integers
Test == 1 \geq 1 /\ 1 >= 1 /\ ~(1 >= 2)
====

(*--- recorded
all:
  exit: 0
---*)
