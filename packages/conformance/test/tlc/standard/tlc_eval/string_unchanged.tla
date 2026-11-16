(*---
description: "TLCEval leaves a string as is: neither conversion applies."
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE string_unchanged ----
EXTENDS TLC, Naturals
Test == PrintT(TLCEval("s"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "s"'
---*)
