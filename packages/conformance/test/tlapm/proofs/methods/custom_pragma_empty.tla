(*---
description: An empty pragma lists no prover, so the obligation falls back to the default methods and SMT proves it.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: proved
---*)
---- MODULE custom_pragma_empty ----
EXTENDS Naturals, TLAPS
Nothing == TRUE (*{ }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Nothing
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

    File "./custom_pragma_empty.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
