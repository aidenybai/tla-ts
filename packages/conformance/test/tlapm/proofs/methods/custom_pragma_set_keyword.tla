(*---
description: The old set keyword in a pragma is read like by.
ref: src/expr/e_parser.ml#read_method_set
mode: proof
outcome: proved
---*)
---- MODULE custom_pragma_set_keyword ----
EXTENDS Naturals, TLAPS
Mine == TRUE (*{ set (prover:"smt") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Mine
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

    File "./custom_pragma_set_keyword.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
