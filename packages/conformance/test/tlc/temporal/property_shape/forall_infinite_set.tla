(*---
description: 'A universal over Nat cannot be unrolled: the failure is ignored at first, then surfaces from astToLive with its cause.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE forall_infinite_set ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == \A n \in Nat : <>(x = n)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 16, col 9 to line 16, col 32 of module forall_infinite_set:
    TLC encountered the non-enumerable quantifier bound
    Nat
    line 16, col 18 to line 16, col 20 of module forall_infinite_set
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
---*)
