(*---
description: A wrong step inside a nested path fails the same way. EXCEPT calls select before takeExcept, and select refuses the subscript first, so takeExcept's warning with this code isn't reached.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: evaluation-failure
config: ""
---*)
---- MODULE nested_path ----
EXTENDS TLC
ASSUME PrintT([<<<<1>>, 2>> EXCEPT ![1]["a"] = 3])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 9, col 8 to line 9, col 50 of module nested_path failed.
    Attempted to access tuple at a non integral index: "a"
---*)
