(*---
description: A model value isn't a function.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE apply_is_an_error ----
CONSTANT A
ASSUME A[1] = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 15 of module apply_is_an_error failed.
    A non-function (a model value) was applied as a function.
    line 10, col 8 to line 10, col 11 of module apply_is_an_error
---*)
