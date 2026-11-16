(*---
description: "\\leq, =< and <= are one operator."
ref: "tlc2/module/Integers.java#LE"
flags: [expression]
outcome: success
---*)
---- MODULE spellings_of_leq ----
EXTENDS Integers
Test == 1 \leq 1 /\ 1 =< 1 /\ 1 <= 1 /\ ~(2 =< 1)
====

(*--- recorded
all:
  exit: 0
---*)
