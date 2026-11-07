(*---
description: The character before the underscore is the type, even when it is an underscore itself.
ref: tlc2/value/impl/ModelValue.java#ModelValue
outcome: assumption-violation
config: |
  CONSTANTS
  A = __x
  B = __x
---*)
---- MODULE double_underscore_is_typed ----
CONSTANTS A, B
ASSUME A = 1
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 12 of module double_underscore_is_typed failed.
    Attempted to check equality of typed model value __x and non-model value
    1
---*)
