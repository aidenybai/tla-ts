(*---
description: A string on the right-hand side of '<-' fails as a wrong substitution.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N <- "a"
---*)
---- MODULE string_rhs_rejected ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for N with the undefined identifier "a".
---*)
