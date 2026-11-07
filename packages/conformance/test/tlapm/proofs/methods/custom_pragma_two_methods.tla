(*---
description: A pragma with two by clauses tries them in order, so Zenon fails on arithmetic and SMT then proves it.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: proved
---*)
---- MODULE custom_pragma_two_methods ----
EXTENDS Naturals, TLAPS
Both == TRUE (*{ by (prover:"zenon") by (prover:"smt") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Both
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

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

    Zenon error: exhausted search space without finding a proof
    File "./custom_pragma_two_methods.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
