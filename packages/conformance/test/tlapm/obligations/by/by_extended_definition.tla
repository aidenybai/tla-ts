(*---
description: DEF of a definition from an extended standard module makes it visible.
ref: src/proof/p_gen.ml#set_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_extended_definition ----
EXTENDS Naturals
Two == 1 + 1
THEOREM Two = 2
  BY DEF Two
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME Two == 1 + 1
    PROVE  Two = 2

    @type: obligationsnumber
    @count: 1
---*)
