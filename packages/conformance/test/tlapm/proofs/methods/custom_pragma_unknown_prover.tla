(*---
description: A pragma naming a prover tlapm does not know reports Unknown prover.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE custom_pragma_unknown_prover ----
EXTENDS Naturals, TLAPS
Mine == TRUE (*{ by (prover:"foo") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Mine
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
    @prover: fail
    @meth: time-limit: inf
    @reason: unexpected error
    @already: false
    @obl: ASSUME Mine 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./custom_pragma_unknown_prover.tla", line 9, characters 22-27 :
    Unknown prover: foo

    File "./custom_pragma_unknown_prover.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Mine 
               PROVE  \A x \in Nat : x + 0 = x
    File "./custom_pragma_unknown_prover.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"custom_pragma_unknown_prover"`.
---*)
