(*---
description: DEF of an outer definition does not make the definitions it uses visible.
ref: src/proof/p_gen.ml#set_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_def_nested_unexpanded ----
CONSTANT c
Inner == c
Outer == Inner
THEOREM Outer = c
  BY DEF Outer
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Outer == Inner
    PROVE  Outer = c

    @type: obligationsnumber
    @count: 1
---*)
