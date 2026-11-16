(*---
description: Print normalizes the copies it prints but returns the original value.
ref: tlc2/module/TLC.java#Print
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE print_normalizes_copy ----
EXTENDS TLC, Naturals
Test == Print({2, 1}, {2, 1}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}  {1, 2}"
---*)
