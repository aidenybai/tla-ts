(*---
description: The syntax corpus case "Proof with Nested Terminal Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_with_nested_terminal_proof ----
EXTENDS TestPrelude
LEMMA TRUE
PROOF
<*> 1
  <+> 2
  <1> QED
    PROOF BY P
<*> 3
  <+> 4
  <1> QED
    OBVIOUS
<*> 5
  <+> 6
  <1> QED
    PROOF OMITTED
<*> 7
<0> QED
====
---- MODULE TestPrelude ----
VARIABLE P
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_proof_with_nested_terminal_proof.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./proofs_proof_with_nested_terminal_proof.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
