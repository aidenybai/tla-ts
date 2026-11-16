(*---
description: With --debug hidden and alldefs, a named theorem is a definition from the proof followed by a hidden fact citing it.
ref: src/module/m_t.ml#hyps_of_modunit
args: ["--debug", "hidden,alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE named_theorem_debug ----
CONSTANT c
THEOREM T == c = c
  OBVIOUS
THEOREM TRUE
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
    @obl: ASSUME NEW CONSTANT c,
           (* from proof *)
           T == c = c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           (* from proof *)
           T == c = c,
           (* hidden *)
           T 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)
