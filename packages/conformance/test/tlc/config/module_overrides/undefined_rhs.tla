(*---
description: The right-hand side of a scoped override may not be undefined.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N = 0
  K <- [module_overrides_fixture] Nope
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE undefined_rhs ----
EXTENDS Naturals, module_overrides_fixture
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for K with the undefined identifier Nope.
---*)
