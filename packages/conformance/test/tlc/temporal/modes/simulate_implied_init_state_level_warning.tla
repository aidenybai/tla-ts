(*---
description: 'The state-level warning is still printed for an implied init, under simulation too.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigProps
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -simulate
  - num=8
  - -depth
  - 6
---*)
---- MODULE simulate_implied_init_state_level_warning ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == x = 0
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2255:3 The formula Prop is a state-level formula, but it was used as a PROPERTY (or PROPERTIES), where a temporal formula is typically expected. State-level formulas used as PROPERTY or PROPERTIES are only checked in the initial state. To verify that the formula Prop holds in all states of every behavior, use INVARIANT Prop instead. Alternatively, applying the "always" temporal operator ([]) to the state-level formula Prop changes it into a temporal formula, asserting that Prop holds in all states of every behavior. See https://explain.tlapl.us/invariants-and-properties for additional details.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(8) at <date>: 17 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 17
    Simulation using seed 4 and aril 0
---*)
