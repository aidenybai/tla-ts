(*---
description: The optional PROOF keyword before BY changes nothing about the obligations.
ref: src/proof/p_parser.ml#preproof
mode: obligations
outcome: proved
---*)
---- MODULE proof_keyword_before_by ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
PROOF BY A
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:7:11:9
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 11:10:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)
