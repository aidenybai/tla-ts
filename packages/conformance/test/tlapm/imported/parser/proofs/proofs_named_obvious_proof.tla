(*---
description: The syntax corpus case "Named Obvious Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE proofs_named_obvious_proof ----
COROLLARY def == TRUE
PROOF OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:7:12:14
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1
---*)
