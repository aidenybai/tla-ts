(*---
description: 'A SPECIFICATION that does not exist fails with TLC_CONFIG_SPECIFIED_NOT_DEFINED.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Missing
---*)
---- MODULE spec_undefined ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The name Missing specified in the configuration file
    is not defined in the specification.
---*)
