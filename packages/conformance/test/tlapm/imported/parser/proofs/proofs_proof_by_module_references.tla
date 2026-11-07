(*---
description: The syntax corpus case "Proof by Module References" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_by_module_references ----
LEMMA TRUE
PROOF BY ONLY
  MODULE Naturals,
  MODULE Integers
  DEFS
    MODULE Reals,
    MODULE Sequences
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_proof_by_module_references.tla", line 12, character 14
    Unexpected keyword MODULE

    @type: warning
    @msg: File "./proofs_proof_by_module_references.tla", line 12, character 14

    Unexpected keyword MODULE

    File "./proofs_proof_by_module_references.tla", line 12, character 14
    Unexpected keyword MODULE
    File "<unknown>":
    Error: Could not parse "./proofs_proof_by_module_references.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
