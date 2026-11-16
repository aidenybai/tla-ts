(*---
description: A RECURSIVE declaration without a definition and never used is accepted, and it is hidden from the obligations.
ref: src/module/m_t.ml#hyps_of_modunit
mode: obligations
outcome: proved
---*)
---- MODULE recursive_declaration_unused ----
RECURSIVE F(_)
THEOREM TRUE
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
    @obl: TRUE

    @type: obligationsnumber
    @count: 1
---*)
