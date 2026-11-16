(*---
description: An undefined _POSSIBLE is called possible.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigPossible
outcome: config-error
config: |
  INIT Init
  NEXT Next
  _POSSIBLE Nope
---*)
---- MODULE possible ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The possible Nope specified in the configuration file
    is not defined in the specification.
---*)
