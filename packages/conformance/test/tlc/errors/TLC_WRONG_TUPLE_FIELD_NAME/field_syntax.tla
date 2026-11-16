(*---
description: The .field form is a string subscript too. EXCEPT calls select before takeExcept, and select refuses the subscript first, so takeExcept's warning with this code isn't reached.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: ""
---*)
---- MODULE field_syntax ----
EXTENDS TLC
ASSUME PrintT([<<1, 2>> EXCEPT !.a = 3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 8 to line 9, col 40 of module field_syntax failed.
    Attempted to access tuple at a non integral index: "a"
---*)
