(*---
description: ToString shows a product staying symbolic, and TLCEval enumerating it.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE product_becomes_enumerated ----
EXTENDS TLC, Naturals
Test == PrintT(<<ToString({1, 2} \X {3}), ToString(TLCEval({1, 2} \X {3}))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<"{<<1, 3>>, <<2, 3>>}", "{<<1, 3>>, <<2, 3>>}">>'
---*)
