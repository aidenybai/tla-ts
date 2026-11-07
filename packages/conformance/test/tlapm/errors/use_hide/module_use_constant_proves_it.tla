(*---
description: A module-level USE of a declared constant gives a support obligation for the constant and adds it as a fact to the later theorems.
ref: src/module/m_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_constant_proves_it ----
CONSTANT c
USE c
THEOREM TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c

    @type: obligation
    @id: 2
    @loc: 10:14:10:21
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)
