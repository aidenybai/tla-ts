(*---
description: TLCEval converts an interval to an enumerated set, visible when printed.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE interval_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(TLCEval(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
