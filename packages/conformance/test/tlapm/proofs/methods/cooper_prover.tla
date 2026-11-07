(*---
description: A pragma with prover "cooper" warns that Cooper's method is no longer available and fails without a reason.
ref: src/backend/prep.ml#prove_with
mode: proof
outcome: failed
---*)
---- MODULE cooper_prover ----
EXTENDS Naturals, TLAPS
Cooper == TRUE (*{ by (prover:"cooper") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Cooper
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
    @prover: cooper
    @meth: time-limit: inf
    @already: false
    @obl: 
    \* Cooper's method is not available any more.

    \A CONSTANT_x_ \in Nat : CONSTANT_x_ + 0 = CONSTANT_x_

    @type: obligation
    @id: 2
    @loc: 11:6:11:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Cooper's method is not available any more.
    File "./cooper_prover.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME Cooper 
               PROVE  \A x \in Nat : x + 0 = x
    File "./cooper_prover.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"cooper_prover"`.
---*)
