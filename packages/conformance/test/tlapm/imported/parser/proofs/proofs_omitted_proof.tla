(*---
description: The syntax corpus case "Omitted Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_omitted_proof ----
THEOREM x == TRUE
PROOF OMITTED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Omitted proof at File "./proofs_omitted_proof.tla", line 12, characters 7-13
    File "./proofs_omitted_proof.tla", line 10, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "proofs_omitted_proof": 0 missing, 1 omitted proof step(s).
---*)
