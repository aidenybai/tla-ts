(*---
description: A variable isn't a constant or a definition, so overriding one is an error.
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANT x <- D
---*)
---- MODULE variable_lhs ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
D == 1
====

(*--- recorded
all:
  exit: 151
  transcript: 2226:1 In the configuration file, the identifier x does not appear in the specification.
---*)
