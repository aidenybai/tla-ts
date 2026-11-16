(*---
description: The syntax corpus case "Theorem Without Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_theorem_without_proof ----
THEOREM TRUE
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./proofs_theorem_without_proof.tla", line 11, character 13
    File "./proofs_theorem_without_proof.tla", line 10, character 1 to line 12, character 4:
    [ERROR]: Proof incomplete in module "proofs_theorem_without_proof": 1 missing, 0 omitted proof step(s).
---*)
