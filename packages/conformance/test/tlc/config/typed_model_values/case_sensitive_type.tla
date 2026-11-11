(*---
description: Type characters are case-sensitive, so x and X are different types.
ref: tlc2/value/impl/ModelValue.java#equals
outcome: assumption-violation
config: |
  CONSTANTS
  A = x_1
  B = X_1
---*)
---- MODULE case_sensitive_type ----
CONSTANTS A, B
ASSUME A = B
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 12 of module case_sensitive_type failed.
    Attempted to check equality of the differently-typed model values x_1 and X_1
---*)
