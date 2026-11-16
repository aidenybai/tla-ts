(*---
description: A second obligation with the same fingerprint as a failed one reuses the failure without running the backend again.
ref: src/backend/prep.ml#already_processed
mode: proof
outcome: failed
---*)
---- MODULE already_failed_in_run ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY Zenon
THEOREM \A x \in Nat : x + 0 = x
  BY Zenon
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
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: true
    @obl: ASSUME Zenon 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 4
    @loc: 12:6:12:11
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 12:6:12:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    Zenon error: exhausted search space without finding a proof
    File "./already_failed_in_run.tla", line 12, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./already_failed_in_run.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./already_failed_in_run.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: 2/4 obligations failed.
    There were backend errors processing module `"already_failed_in_run"`.
---*)
