(*---
description: A model value can't be enumerated as a quantifier's domain.
ref: tlc2/tool/impl/Tool.java#evalAppl
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE enumerate_is_an_error ----
CONSTANT A
ASSUME \A e \in A : TRUE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 24 of module enumerate_is_an_error failed.
    TLC encountered a non-enumerable quantifier bound
    m.
    line 10, col 17 to line 10, col 17 of module enumerate_is_an_error
---*)
