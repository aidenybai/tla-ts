(*---
description: PrintT prints a tuple with spaces after commas.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE printt_tuple ----
EXTENDS TLC, Naturals
Test == PrintT(<<1, "a", {2}>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {2}>>'
---*)
