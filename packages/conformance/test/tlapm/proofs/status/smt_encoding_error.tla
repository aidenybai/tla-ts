(*---
description: When type synthesis cannot encode a second-order application, the SMT backend is not run and the reason is the encoder's message.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
outcome: failed
---*)
---- MODULE smt_encoding_error ----
EXTENDS TLAPS
CONSTANT G(_)
THEOREM ASSUME NEW F(_), G(F) PROVE G(F)
  BY SMT
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: Type.Synthesize: Impossible operator conversion
    @already: false
    @obl: 
    ASSUME NEW CONSTANT G(_),
           NEW CONSTANT F(_),
           G(F) ,
           TRUE 
    PROVE  G(F)

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smt_encoding_error.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT G(_),
                      NEW CONSTANT F(_),
                      G(F) ,
                      SMT 
               PROVE  G(F)
    File "./smt_encoding_error.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"smt_encoding_error"`.
---*)
