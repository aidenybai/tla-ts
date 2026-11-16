(*---
description: A plain constant overridden by an operator with arguments fails the same arity check.
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
outcome: config-error
config: |
  CONSTANT N <- G
---*)
---- MODULE arity_mismatch_plain_constant ----
CONSTANT N
G(a) == a
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2225:1 The configuration file substitutes for N with G of different number of arguments.
---*)
