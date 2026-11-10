(*---
description: An integer subscript on a record is an evaluation error. EXCEPT calls select before takeExcept, and select refuses the subscript first, so takeExcept's warning with this code isn't reached.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: ""
---*)
---- MODULE integer_subscript ----
EXTENDS TLC
ASSUME PrintT([[a |-> 1] EXCEPT ![1] = 2])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 8 to line 9, col 42 of module integer_subscript failed.
    Attempted to access record by a non-string argument: 1
---*)
