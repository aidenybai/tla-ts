(*---
description: Print returns its second argument, with the first only printed.
ref: tlc2/module/TLC.java#Print
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE print_returns_second ----
EXTENDS TLC, Naturals
Test == Print("label", 2) + 1 = 3
====

(*--- recorded
all:
  exit: 0
  transcript: '| "label"  2'
---*)
