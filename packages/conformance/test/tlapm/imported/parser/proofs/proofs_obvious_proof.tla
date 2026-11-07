(*---
description: The syntax corpus case "Obvious Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE proofs_obvious_proof ----
LEMMA TRUE
OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:1:12:8
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1
---*)
