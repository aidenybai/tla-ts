(*---
description: ToString shows UNION staying symbolic, and TLCEval enumerating it.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE union_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(<<ToString(UNION {{1}, {2}}), ToString(TLCEval(UNION {{1}, {2}}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"{1, 2}", "{1, 2}">>'
---*)
