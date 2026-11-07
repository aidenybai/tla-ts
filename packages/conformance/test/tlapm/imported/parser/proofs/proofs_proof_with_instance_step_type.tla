(*---
description: The syntax corpus case "Proof with INSTANCE step type" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_with_instance_step_type ----
THEOREM TRUE
<1>a..... INSTANCE M
<1>b..... QED
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_proof_with_instance_step_type.tla", line 12, character 10
    required expressions(s) missing before 'keyword INSTANCE'

    @type: warning
    @msg: File "./proofs_proof_with_instance_step_type.tla", line 12, character 10

    required expressions(s) missing before 'keyword INSTANCE'

    File "./proofs_proof_with_instance_step_type.tla", line 12, character 10
    required expressions(s) missing before 'keyword INSTANCE'
    File "<unknown>":
    Error: Could not parse "./proofs_proof_with_instance_step_type.tla" successfully.
     tlapm ending abnormally with Failure("Module.Parser.parse_file")
---*)
