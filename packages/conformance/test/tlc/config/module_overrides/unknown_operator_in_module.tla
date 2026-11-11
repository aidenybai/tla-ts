(*---
description: A scoped override of a name the module doesn't define fails.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N = 0
  Nope <- [module_overrides_fixture] Alt
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE unknown_operator_in_module ----
EXTENDS Naturals, module_overrides_fixture
Alt == 2
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2226:1 In the configuration file, the identifier Nope does not appear in the specification.
---*)
