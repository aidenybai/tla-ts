(*---
description: Two backend pragmas are cited in order, and the second's support obligation has the first as a fact.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_two_backend_pragmas ----
EXTENDS TLAPS
THEOREM TRUE
  BY SMT, Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME SMT ,
           Zenon 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved
    @obl: SMT

    @type: obligation
    @id: 3
    @loc: 10:11:10:16
    @status: to be proved
    @obl: ASSUME SMT 
    PROVE  Zenon

    @type: obligationsnumber
    @count: 3
---*)
