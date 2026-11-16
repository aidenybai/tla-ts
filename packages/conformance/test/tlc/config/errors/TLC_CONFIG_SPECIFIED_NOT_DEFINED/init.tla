(*---
description: An undefined INIT is called the initial predicate.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  INIT Nope
  NEXT Next
---*)
---- MODULE init ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The initial predicate Nope specified in the configuration file
    is not defined in the specification.
---*)
