(*---
description: ToString shows a function set staying symbolic, and TLCEval enumerating it.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE function_set_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(<<ToString([{1} -> {2, 3}]), ToString(TLCEval([{1} -> {2, 3}]))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"{<<2>>, <<3>>}", "{<<2>>, <<3>>}">>'
---*)
