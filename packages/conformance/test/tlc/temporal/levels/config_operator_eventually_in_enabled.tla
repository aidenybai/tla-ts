(*---
description: 'A constant operator replaced in the config escapes SANY''s level check, so ENABLED reaches a temporal operator at run time and fails with TLC_ENABLED_WRONG_FORMULA naming it.'
ref: tlc2/tool/impl/Tool.java#enabledAppl
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
  CONSTANT Op <- T
---*)
---- MODULE config_operator_eventually_in_enabled ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
CONSTANT Op(_)
T(a) == <>(x = 1)
Prop == <>ENABLED Op(TRUE)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2102:1 While working on the initial state:
    x = 0
    2260:0 In computing ENABLED, TLC encountered a temporal formula (<>).
    line 18, col 9 to line 18, col 17 of module config_operator_eventually_in_enabled
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
