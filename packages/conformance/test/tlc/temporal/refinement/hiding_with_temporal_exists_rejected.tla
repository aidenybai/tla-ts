(*---
description: 'Hiding with \EE is the textbook refinement form, which TLC cannot check: TLC_LIVE_CANNOT_HANDLE_FORMULA from astToLive.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness, refinement]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE hiding_with_temporal_exists_rejected ----
EXTENDS Naturals
VARIABLE x

---- MODULE Abs ----
EXTENDS Naturals
VARIABLE v
AInit == v = 0
ANext == v < 2 /\ v' = v + 1
ASpec == AInit /\ [][ANext]_v
ALive == ASpec /\ WF_v(ANext)
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
A == INSTANCE Abs WITH v <- x

Prop == \EE h : A!ASpec
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 27, col 9 to line 27, col 23 of module hiding_with_temporal_exists_rejected
---*)
