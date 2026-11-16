(*---
description: A module nested in the file isn't in the external module table that the check reads, so a scoped override naming it fails as an unknown module.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT K <- [inner] Alt
---*)
---- MODULE nested_module_is_not_a_module ----
---- MODULE inner ----
K == 1
Get == K
====
I == INSTANCE inner
Alt == 2
ASSUME I!Get = 2
====

(*--- recorded
all:
  exit: 151
  transcript: 2245:1 In the configuration file, the module name inner is not a module in the specification.
---*)
