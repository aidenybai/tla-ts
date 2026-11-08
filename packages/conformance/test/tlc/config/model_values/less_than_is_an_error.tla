(*---
description: An untyped model value compares with anything for equality, but Naturals' < needs an integer.
ref: tlc2/module/Naturals.java#LT
outcome: assumption-violation
config: |
  CONSTANT A = m
---*)
---- MODULE less_than_is_an_error ----
EXTENDS Naturals
CONSTANT A
ASSUME A < 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 12 of module less_than_is_an_error failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    m
---*)
