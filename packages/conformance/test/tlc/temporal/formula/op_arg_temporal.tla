(*---
description: 'A temporal argument is bound lazily, but its use as a formal parameter has temporal level, which astToLiveAppl cannot translate: TLC_LIVE_CANNOT_HANDLE_FORMULA at the parameter.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE op_arg_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Al(p) == []p
Prop == Al(<>(x = 2))
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 16, col 12 to line 16, col 12 of module op_arg_temporal
---*)
