(*---
description: 'BUG: an operator constant substituted by a built-in operator: getLevelBoundAppl recurses into the built-in OpDefNode''s null body and TLC dies with a NullPointerException.'
ref: tlc2/tool/impl/SymbolNodeValueLookupProvider.java#getLevelBoundAppl
features: [liveness, refinement, tlc-bug]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE substitution_of_action_operator_builtin ----
EXTENDS Naturals
VARIABLE x
---- MODULE Ops ----
EXTENDS Naturals
VARIABLE v
CONSTANT Combine(_, _)
G == Combine(<>(v = 1), <>(v = 2))
====
N == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][N]_x /\ WF_x(N)
O == INSTANCE Ops WITH v <- x, Combine <- \land
Prop == O!G
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.NullPointerException
    : Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
