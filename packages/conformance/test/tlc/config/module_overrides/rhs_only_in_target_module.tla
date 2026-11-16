(*---
description: The right-hand side is resolved among the root's definitions, so a definition the root can't see fails even though the target module has it.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT K <- [module_overrides_fixture] Get
includes:
  - module_overrides_fixture.tla
---*)
---- MODULE rhs_only_in_target_module ----
I == INSTANCE module_overrides_fixture WITH N <- 0
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2224:1 The configuration file substitutes for K with the undefined identifier Get.
---*)
