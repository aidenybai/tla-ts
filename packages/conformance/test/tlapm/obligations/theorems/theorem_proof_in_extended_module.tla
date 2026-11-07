(*---
description: Theorems of an extended module get no obligations, because only the module given on the command line is checked.
ref: src/proof/p_gen.ml#generate
includes: [ExtendedLemmas.tla]
mode: obligations
outcome: proved
---*)
---- MODULE theorem_proof_in_extended_module ----
EXTENDS ExtendedLemmas
THEOREM 2 = 2
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: 2 = 2

    @type: obligationsnumber
    @count: 1
---*)
