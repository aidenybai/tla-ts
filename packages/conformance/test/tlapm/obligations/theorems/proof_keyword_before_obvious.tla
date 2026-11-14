(*---
description: The optional PROOF keyword before a leaf proof changes nothing about the obligation.
ref: src/proof/p_parser.ml#preproof
mode: obligations
outcome: proved
---*)
---- MODULE proof_keyword_before_obvious ----
THEOREM 2 = 2
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:7:9:14
    @status: to be proved
    @obl: 2 = 2

    @type: obligationsnumber
    @count: 1
---*)
