(*---
description: A model value isn't a set.
ref: tlc2/value/impl/ModelValue.java#member
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE member_of_model_value_is_an_error ----
CONSTANT A
ASSUME 1 \in A
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 14 of module member_of_model_value_is_an_error failed.
    Attempted to check if the value:
    1
    is an element of the model value m
---*)
