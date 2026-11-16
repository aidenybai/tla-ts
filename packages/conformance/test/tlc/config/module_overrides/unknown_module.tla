(*---
description: A scoped override naming a module outside the spec fails with the module's name.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  CONSTANT K <- [Nope] Alt
---*)
---- MODULE unknown_module ----
K == 1
Alt == 2
ASSUME TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: 2245:1 In the configuration file, the module name Nope is not a module in the specification.
---*)
