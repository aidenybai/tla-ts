(*---
description: A scoped override with a different arity is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N = 0
  K <- [module_overrides_fixture] Alt
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE arity_mismatch ----
EXTENDS Naturals, module_overrides_fixture
Alt(a, b) == a
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2225:1 The configuration file substitutes for K with Alt of different number of arguments.
---*)
