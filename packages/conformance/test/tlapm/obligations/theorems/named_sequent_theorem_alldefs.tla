(*---
description: With --debug alldefs, the definition of a named ASSUME ... PROVE theorem prints the whole sequent.
ref: src/module/m_t.ml#hyps_of_modunit
args: ["--debug", "alldefs"]
mode: obligations
outcome: proved
---*)
---- MODULE named_sequent_theorem_alldefs ----
CONSTANT P(_)
THEOREM T == ASSUME NEW x PROVE P(x) \/ ~P(x)
  OBVIOUS
THEOREM TRUE
  BY T
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           (* from proof *)
           T == ASSUME NEW CONSTANT x
                PROVE  P(x) \/ ~P(x),
           NEW CONSTANT x
    PROVE  P(x) \/ ~P(x)

    @type: obligation
    @id: 2
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           (* from proof *)
           T == ASSUME NEW CONSTANT x
                PROVE  P(x) \/ ~P(x),
           T 
    PROVE  TRUE

    @type: obligation
    @id: 3
    @loc: 13:6:13:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           (* from proof *)
           T == ASSUME NEW CONSTANT x
                PROVE  P(x) \/ ~P(x)
    PROVE  T

    @type: obligationsnumber
    @count: 3
---*)
