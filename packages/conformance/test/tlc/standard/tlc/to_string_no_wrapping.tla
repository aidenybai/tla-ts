(*---
description: "ToString never wraps: only ppr does, for printing."
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE to_string_no_wrapping ----
EXTENDS TLC, Naturals, Sequences
Test == LET t == ToString([i \in 1..30 |-> 1000000000]) IN Len(t) = 30 * 10 + 29 * 2 + 4
====

(*--- recorded
all:
  exit: 0
---*)
