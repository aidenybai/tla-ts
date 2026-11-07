(*---
description: The syntax corpus case "Proof by QED with implicit step level" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_by_qed_with_implicit_step_level ----
THEOREM TRUE
PROOF
  <1>a TRUE
  <1>b QED BY <*>a
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_proof_by_qed_with_implicit_step_level.tla", line 14, character 14
    Unexpected <*>

    @type: warning
    @msg: File "./proofs_proof_by_qed_with_implicit_step_level.tla", line 14, character 14

    Unexpected <*>

    File "./proofs_proof_by_qed_with_implicit_step_level.tla", line 14, character 14
    Unexpected <*>
    File "<unknown>":
    Error: Could not parse "./proofs_proof_by_qed_with_implicit_step_level.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
