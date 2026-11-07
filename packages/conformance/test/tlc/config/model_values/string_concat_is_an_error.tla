(*---
description: A model value isn't a sequence, so \o rejects it.
ref: tlc2/module/Sequences.java#Concat
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE string_concat_is_an_error ----
EXTENDS Sequences
CONSTANT A
ASSUME A \o "x" = "y"
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    m
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    m
---*)
