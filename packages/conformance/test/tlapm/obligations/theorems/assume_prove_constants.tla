(*---
description: The NEW declarations of a theorem's ASSUME are appended to the context after the module's declarations.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_constants ----
CONSTANT c
THEOREM ASSUME NEW a, NEW b PROVE a = a
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  a = a

    @type: obligationsnumber
    @count: 1
---*)
