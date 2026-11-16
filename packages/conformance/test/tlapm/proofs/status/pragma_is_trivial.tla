(*---
description: Citing a pragma makes a support obligation for its body TRUE, which tlapm marks trivial with prover tlapm.
ref: src/backend/prep.ml#trivial
mode: proof
outcome: proved
---*)
---- MODULE pragma_is_trivial ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMT
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
    @prover: smt
    @meth: time-limit: 5
    @already: false

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

    File "./pragma_is_trivial.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
