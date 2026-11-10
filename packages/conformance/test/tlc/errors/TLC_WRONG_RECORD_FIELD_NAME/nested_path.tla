(*---
description: A wrong step inside a nested path fails the same way. EXCEPT calls select before takeExcept, and select refuses the subscript first, so takeExcept's warning with this code isn't reached.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: ""
---*)
---- MODULE nested_path ----
EXTENDS TLC
ASSUME PrintT([[a |-> [b |-> 1]] EXCEPT !.a[1] = 2])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 8 to line 9, col 52 of module nested_path failed.
    Attempted to access record by a non-string argument: 1
---*)
