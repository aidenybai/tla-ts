(*---
description: Scoped overrides replace definitions only, so a constant declared in the module doesn't count as defined.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT N = 0
  N <- [module_overrides_fixture] Alt
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE constant_decl_not_allowed ----
EXTENDS Naturals, module_overrides_fixture
Alt == 2
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2226:1 In the configuration file, the identifier N does not appear in the specification.
---*)
