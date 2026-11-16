(*---
description: A scoped right-hand side that also appears as a left-hand side for the same module is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N = 0
  A <- [module_overrides_fixture] B
  B <- [module_overrides_fixture] C
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE rhs_also_overridden_in_module ----
EXTENDS Naturals, module_overrides_fixture
C == 3
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2223:1 In the configuration file, the identifier B appears
    on the right-hand side of a <- after already appearing on the
    left-hand side of one.
---*)
