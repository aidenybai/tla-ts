(*---
description: Without a pragma tlapm tries the SMT solver first, and it proves an arithmetic fact.
ref: src/params.ml#default_method
mode: proof
outcome: proved
---*)
---- MODULE smt_first ----
EXTENDS Naturals
THEOREM \A x \in Nat : x + 0 = x
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./smt_first.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 1 obligation proved.
---*)
