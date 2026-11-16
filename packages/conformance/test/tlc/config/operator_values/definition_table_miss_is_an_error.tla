(*---
description: A table replaces the whole definition, so an argument it doesn't list no longer falls back to the old body.
ref: tlc2/value/impl/OpRcdValue.java#apply
outcome: assumption-violation
config: |
  CONSTANT G(1) = 9
---*)
---- MODULE definition_table_miss_is_an_error ----
EXTENDS Naturals
G(a) == a + 1
ASSUME G(2) = 3
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 11, col 8 to line 11, col 15 of module definition_table_miss_is_an_error failed.
    Attempted to apply operator:
    { <1, 9>}
    to arguments (2), which is undefined.
---*)
