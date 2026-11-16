(*---
description: PrintT prints the empty string.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_empty_string ----
EXTENDS TLC, Naturals
Test == PrintT("")
====

(*--- recorded
all:
  exit: 0
  transcript: '| ""'
---*)
