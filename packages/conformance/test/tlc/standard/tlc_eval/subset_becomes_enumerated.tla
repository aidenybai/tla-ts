(*---
description: ToString shows SUBSET staying symbolic, and TLCEval enumerating it.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE subset_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(<<ToString(SUBSET {1, 2}), ToString(TLCEval(SUBSET {1, 2}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"{{}, {1}, {2}, {1, 2}}", "{{}, {1}, {2}, {1, 2}}">>'
---*)
