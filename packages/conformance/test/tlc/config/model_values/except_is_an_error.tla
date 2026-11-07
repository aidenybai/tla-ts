(*---
description: EXCEPT can't apply to a model value.
ref: tlc2/value/impl/ModelValue.java#takeExcept
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE except_is_an_error ----
CONSTANT A
ASSUME [A EXCEPT ![1] = 2] = 3
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 30 of module except_is_an_error failed.
    Attempted to apply EXCEPT construct to the value m.
---*)
