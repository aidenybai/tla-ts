(*---
description: Two lines of one table with different argument counts are rejected.
ref: tlc2/tool/impl/SpecProcessor.java#makeConstantTable
outcome: config-error
config: |
  CONSTANT F(1) = 2
  F(1, 2) = 3
---*)
---- MODULE arity_inconsistent ----
CONSTANT F(_)
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2242:1 The arity of the operator F is inconsistent in the configuration file.
---*)
