(*---
description: ToString shows a record set staying symbolic, and TLCEval enumerating it.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE record_set_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(<<ToString([a : {1, 2}]), ToString(TLCEval([a : {1, 2}]))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"{[a |-> 1], [a |-> 2]}", "{[a |-> 1], [a |-> 2]}">>'
---*)
