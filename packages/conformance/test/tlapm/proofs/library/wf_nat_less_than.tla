(*---
description: Citing NatLessThanWellFounded proves its own statement.
ref: library/WellFoundedInduction.tla#NatLessThanWellFounded
mode: proof
outcome: proved
---*)
---- MODULE wf_nat_less_than ----
EXTENDS Naturals, WellFoundedInduction, TLAPS
THEOREM IsWellFoundedOn(OpToRel(<, Nat), Nat)
  BY NatLessThanWellFounded, Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:28
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:30:10:35
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:30:10:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./wf_nat_less_than.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
