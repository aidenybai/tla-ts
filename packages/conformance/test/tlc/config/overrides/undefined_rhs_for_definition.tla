(*---
description: An undefined right-hand side fails as a wrong substitution for a definition too.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT D <- Nope
---*)
---- MODULE undefined_rhs_for_definition ----
D == 1
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for D with the undefined identifier Nope.
---*)
