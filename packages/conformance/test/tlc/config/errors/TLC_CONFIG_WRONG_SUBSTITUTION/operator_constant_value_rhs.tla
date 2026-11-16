(*---
description: An operator constant's right-hand side must be defined.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT F <- Nope
---*)
---- MODULE operator_constant_value_rhs ----
CONSTANT F(_)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for F with the undefined identifier Nope.
---*)
