(*---
description: Print prints both values separated by two spaces.
ref: tlc2/module/TLC.java#Print
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE print_prints_both ----
EXTENDS TLC, Naturals
Test == Print("a", TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: '| "a"  TRUE'
---*)
