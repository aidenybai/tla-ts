(*---
description: Plain auto does not prove set equality from extensionality, so Isa fails where IsaWithSetExtensionality succeeds.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE isa_with_set_extensionality_needed ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, \A x : x \in S <=> x \in T PROVE S = T
  BY Isa
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT S,
           NEW CONSTANT T,
           \A x : x \in S <=> x \in T ,
           TRUE 
    PROVE  S = T

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./isa_with_set_extensionality_needed.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT S,
                      NEW CONSTANT T,
                      \A x : x \in S <=> x \in T ,
                      Isa 
               PROVE  S = T
    File "./isa_with_set_extensionality_needed.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"isa_with_set_extensionality_needed"`.
---*)
