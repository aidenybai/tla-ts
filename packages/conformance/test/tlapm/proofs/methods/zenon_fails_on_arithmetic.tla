(*---
description: Zenon has no arithmetic decision procedure, so it exhausts its search on a fact about addition and the obligation fails with reason false.
ref: src/backend/prep.ml#zenon_prove
mode: proof
outcome: failed
---*)
---- MODULE zenon_fails_on_arithmetic ----
EXTENDS Naturals, TLAPS
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

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    File "./zenon_fails_on_arithmetic.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Zenon 
               PROVE  \A x \in Nat : x + 0 = x
    File "./zenon_fails_on_arithmetic.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zenon_fails_on_arithmetic"`.
---*)
