(*---
description: A named theorem's definition is visible from the start, so DEF of it is accepted and changes nothing, and --debug hidden,alldefs prints it unmarked as one that comes from a proof.
ref: src/proof/p_anon.ml#usable
args: ["--debug", "hidden,alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE by_def_theorem_name ----
CONSTANT c
THEOREM T == c = c
  OBVIOUS
THEOREM c = c
  BY DEF T
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* from proof *)
           T == c = c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* from proof *)
           T == c = c,
           (* hidden *)
           T 
    PROVE  c = c

    @type: obligationsnumber
    @count: 2
---*)
