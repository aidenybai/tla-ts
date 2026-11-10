(*---
description: 'An evaluation failure of a constant subformula during translation surfaces as that error.'
ref: tlc2/tool/liveness/Liveness.java#astToLive
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE eval_error_in_constant_subformula ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == (1 + "a" = 2) => <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2154:1 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
---*)
