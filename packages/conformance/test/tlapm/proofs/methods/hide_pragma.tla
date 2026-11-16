(*---
description: Hiding a pragma after USE removes it from the context, so the default methods apply again and SMT proves the arithmetic fact.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: proved
---*)
---- MODULE hide_pragma ----
EXTENDS Naturals, TLAPS
USE Zenon
HIDE Zenon
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 9:1:9:4
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./hide_pragma.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 2 obligations proved.
---*)
