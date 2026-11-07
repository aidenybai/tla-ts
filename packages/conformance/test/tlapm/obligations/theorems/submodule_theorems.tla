(*---
description: A submodule is checked as a module of its own, with its own obligation count, and its theorems are also obligations of the enclosing module, numbered before the theorems that follow it.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE submodule_theorems ----
---- MODULE Inner ----
THEOREM 1 = 1
  OBVIOUS
====
THEOREM 2 = 2
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
    @obl: 1 = 1

    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: 1 = 1

    @type: obligation
    @id: 2
    @loc: 13:3:13:10
    @status: to be proved
    @obl: 2 = 2

    @type: obligationsnumber
    @count: 1

    @type: obligationsnumber
    @count: 2
---*)
