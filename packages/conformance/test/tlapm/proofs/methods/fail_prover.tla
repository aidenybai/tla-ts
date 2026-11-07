(*---
description: A pragma with prover "fail" never proves anything and records no result, so the obligation ends as an untreated failure.
ref: src/backend/prep.ml#prove_with
mode: proof
outcome: failed
---*)
---- MODULE fail_prover ----
EXTENDS Naturals, TLAPS
Failing == TRUE (*{ by (prover:"fail") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Failing
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
    @obl: ASSUME Failing 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 2
    @loc: 11:6:11:13
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./fail_prover.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Failing 
               PROVE  \A x \in Nat : x + 0 = x
    File "./fail_prover.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"fail_prover"`.
---*)
