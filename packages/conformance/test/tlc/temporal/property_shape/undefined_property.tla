(*---
description: 'A PROPERTY that does not exist fails with TLC_CONFIG_SPECIFIED_NOT_DEFINED, spelled as property.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE undefined_property ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The property Prop specified in the configuration file
    is not defined in the specification.
---*)
