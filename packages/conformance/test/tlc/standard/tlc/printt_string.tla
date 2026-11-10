(*---
description: PrintT prints a string with its quotes.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_string ----
EXTENDS TLC, Naturals
Test == PrintT("abc")
====

(*--- recorded
all:
  exit: 0
  transcript: '| "abc"'
---*)
