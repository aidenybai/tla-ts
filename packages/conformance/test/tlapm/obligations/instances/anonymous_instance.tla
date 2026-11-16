(*---
description: An unnamed INSTANCE brings the module's definitions and theorems in under their own names.
ref: src/module/m_elab.ml#normalize
includes: [Lib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE anonymous_instance ----
CONSTANT k
VARIABLE v
INSTANCE Lib
THEOREM Op(k)
  BY LT DEF Op
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
           Op(a) == a = k,
           LT 
    PROVE  Op(k)

    @type: obligation
    @id: 2
    @loc: 13:6:13:8
    @status: to be proved
    @obl: ASSUME NEW CONSTANT k,
           NEW VARIABLE v,
           Op(a) == a = k
    PROVE  LT

    @type: obligationsnumber
    @count: 2
---*)
