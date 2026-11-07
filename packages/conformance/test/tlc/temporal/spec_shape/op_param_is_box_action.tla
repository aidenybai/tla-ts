(*---
description: 'BUG: processConfigSpec inlines Machine and accepts a formal parameter inside the box, but Tool.getActionsAppl then casts the formal parameter node to OpDefNode and crashes with a ClassCastException, where the spec is meaningful and should be checked.'
ref: tlc2/tool/impl/Tool.java#getActionsAppl
features: [liveness, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE op_param_is_box_action ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Machine(i, n) == i /\ [][n]_x
Spec == Machine(Init, Next)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.ClassCastException
    : class tla2sany.semantic.FormalParamNode cannot be cast to class tla2sany.semantic.OpDefNode (tla2sany.semantic.FormalParamNode and tla2sany.semantic.OpDefNode are in unnamed module of loader 'app')
---*)
