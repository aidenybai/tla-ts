(*---
description: A named theorem of an extended module can be cited, and is a fact of the context.
ref: src/module/m_gen.ml#generate
includes: [ExtendedLemmas.tla]
mode: obligations
outcome: proved
---*)
---- MODULE extended_theorem_cited ----
EXTENDS ExtendedLemmas
THEOREM 1 = 1
  BY Ext
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME Ext 
    PROVE  1 = 1

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved
    @obl: Ext

    @type: obligationsnumber
    @count: 2
---*)
