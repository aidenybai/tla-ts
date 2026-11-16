(*---
description: 'With -lncheck off, the formula is still translated and an untranslatable one still fails.'
ref: tlc2/tool/liveness/Liveness.java#processLiveness
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -lncheck
  - off
---*)
---- MODULE lncheck_off_still_prints_branches ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == <>(x = 1) <=> <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 19, col 9 to line 19, col 31 of module lncheck_off_still_prints_branches
---*)
