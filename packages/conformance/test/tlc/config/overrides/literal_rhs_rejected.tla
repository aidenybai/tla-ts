(*---
description: The right-hand side of '<-' must name a definition, so a number fails as a wrong substitution.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N <- 3
---*)
---- MODULE literal_rhs_rejected ----
CONSTANT N
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for N with the undefined identifier 3.
---*)
