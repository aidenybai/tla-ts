(*---
description: A string at constant level is evaluated while the formula is translated, so it gets TLC_EXPECTED_VALUE rather than this code.
ref: tlc2/tool/liveness/Liveness.java#astToLive
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE constant_string_is_refused_earlier ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x
Prop == "a" ~> (x = 0)
====

(*--- recorded
all:
  exit: 255
  transcript: 2215:1 TLC expected a boolean value, but did not find one. line 15, col 9 to line 15, col 11 of module constant_string_is_refused_earlier
---*)
