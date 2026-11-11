(*---
description: 'An unbounded existential over a temporal formula has no translation: TLC_LIVE_CANNOT_HANDLE_FORMULA.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE unbounded_exists_temporal_rejected ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \E n : <>(x = n)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 16, col 9 to line 16, col 24 of module unbounded_exists_temporal_rejected
---*)
