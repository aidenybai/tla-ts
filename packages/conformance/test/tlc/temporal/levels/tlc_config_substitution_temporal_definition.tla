(*---
description: 'A constant cannot be replaced by a temporal definition: non-constant substitution error.'
ref: tlc2/tool/impl/SpecProcessor.java#processConstantDefns
features: [liveness, levels]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT C <- T
---*)
---- MODULE tlc_config_substitution_temporal_definition ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT C
T == <>(x = 1)
Prop == C
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2281:1 The configuration file substitutes constant C with non-constant T - specifically: @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 6 to line 18, col 14 of module tlc_config_substitution_temporal_definition
    2281:1 The configuration file substitutes constant C with non-constant T - specifically: @!@!@STARTMSG 2261:0 @!@!@
    TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 18, col 6 to line 18, col 14 of module tlc_config_substitution_temporal_definition
---*)
