(*---
description: A definition overridden by an operator of different arity is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT D <- G
---*)
---- MODULE arity_mismatch_definition ----
D == 1
G(a) == a
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2225:1 The configuration file substitutes for D with G of different number of arguments.
---*)
