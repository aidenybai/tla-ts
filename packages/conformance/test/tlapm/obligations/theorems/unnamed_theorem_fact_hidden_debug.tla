(*---
description: With --debug hidden, an earlier unnamed theorem shows up as a hidden fact in the context of a later theorem's obligation.
ref: src/module/m_gen.ml#generate
args: ["--debug", "hidden"]
mode: obligations
outcome: proved
---*)
---- MODULE unnamed_theorem_fact_hidden_debug ----
CONSTANT c
THEOREM c = c
  OBVIOUS
THEOREM c # 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* hidden *)
           c = c 
    PROVE  c # 1

    @type: obligationsnumber
    @count: 2
---*)
