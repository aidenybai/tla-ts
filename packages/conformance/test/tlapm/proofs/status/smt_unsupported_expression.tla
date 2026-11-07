(*---
description: Temporal existential quantification cannot be written as SMT-LIB, and the reason is the SMT-LIB printer's message.
ref: src/backend/smtlib.ml#fmt_expr
mode: proof
outcome: failed
---*)
---- MODULE smt_unsupported_expression ----
EXTENDS TLAPS
VARIABLE x
THEOREM \EE z : z = x
  BY SMT
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
    @prover: smt
    @meth: time-limit: 5
    @reason: Backend.Smtlib: Unsupported expression
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           TRUE 
    PROVE  \EE z : z = x

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smt_unsupported_expression.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      SMT 
               PROVE  \EE z : z = x
    File "./smt_unsupported_expression.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"smt_unsupported_expression"`.
---*)
