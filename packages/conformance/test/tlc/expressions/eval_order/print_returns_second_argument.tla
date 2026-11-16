(*---
description: "Print prints both arguments and returns the second."
ref: "tlc2/module/TLC.java#Print"
flags: [expression]
outcome: success
---*)
---- MODULE print_returns_second_argument ----
EXTENDS Integers, TLC
Test == Print(1, 2) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1  2"
---*)
