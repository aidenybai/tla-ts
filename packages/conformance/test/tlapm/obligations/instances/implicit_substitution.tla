(*---
description: A parameter missing from WITH is substituted by the identifier of the same name in scope.
ref: src/module/m_elab.ml#complete_with_statement_params
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE implicit_substitution ----
CONSTANT k
VARIABLE v
I == INSTANCE Lib
THEOREM I!Op(k)
  BY DEF I!Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT k,
           NEW VARIABLE v,
           I!Op(a) == a = k
    PROVE  I!Op(k)

    @type: obligationsnumber
    @count: 1
---*)
