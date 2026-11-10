(*---
description: An operator constant overridden by an operator of different arity fails after definitions are collected.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
outcome: config-error
config: |
  CONSTANT F <- G
---*)
---- MODULE arity_mismatch_constant ----
CONSTANT F(_)
G(a, b) == a
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2225:1 The configuration file substitutes for F with G of different number of arguments.
---*)
