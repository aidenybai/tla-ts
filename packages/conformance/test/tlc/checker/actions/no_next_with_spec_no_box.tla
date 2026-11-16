(*---
description: A SPECIFICATION with no box has no action, so TLC checks the initial states and reports it has states but no next action.
ref: tlc2/tool/ModelChecker.java#modelCheckImpl
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
---*)
---- MODULE no_next_with_spec_no_box ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Inv == x = 0
Spec == Init
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2115:1 No next state actions defined to generate successor states from.
---*)
