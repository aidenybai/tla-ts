(*---
description: A Boolean subscript on a tuple is an evaluation error. EXCEPT calls select before takeExcept, and select refuses the subscript first, so takeExcept's warning with this code isn't reached.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: ""
---*)
---- MODULE boolean_index ----
EXTENDS TLC
ASSUME PrintT([<<1, 2>> EXCEPT ![TRUE] = 3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 8 to line 9, col 44 of module boolean_index failed.
    Attempted to access tuple at a non integral index: TRUE
---*)
