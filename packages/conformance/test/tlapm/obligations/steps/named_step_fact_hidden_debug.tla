(*---
description: With --debug hidden, a numbered step's fact appears hidden in the QED obligation, next to the step's definition.
ref: src/proof/p_gen.ml#use_assertion
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE named_step_fact_hidden_debug ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 == c = c,
           (* hidden *)
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* hidden *)
           TRUE ,
           <1>1 == TRUE,
           (* hidden *)
           <1>1 
    PROVE  c = c

    @type: obligationsnumber
    @count: 2
---*)
