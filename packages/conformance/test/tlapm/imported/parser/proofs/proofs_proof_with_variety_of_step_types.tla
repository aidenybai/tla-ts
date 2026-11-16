(*---
description: The syntax corpus case "Proof with Variety of Step Types" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_proof_with_variety_of_step_types ----
THEOREM TRUE
<1>a..... TRUE
<1>b..... DEFINE op2 == 2
<1>c..... HAVE 3
<1>d..... WITNESS 2, 3
<1>e..... TAKE x, y, z
<1>f..... <1>a
<1>g..... SUFFICES 5
<1>h..... CASE 6
<1>i..... PICK a, b, c : 7
<1>j..... HIDE 8
<1>k..... USE 9
<1>m..... QED
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: error
    @url: http://tla.msr-inria.inria.fr/bugs
    @msg: Oops, this seems to be a bug in TLAPM.
    Please give feedback to developers.


     Failure("proof.Gen.set_expr")

    File "./proofs_proof_with_variety_of_step_types.tla", line 21, character 16:
    Error: This expression does not appear in the context and cannot be hidden.
     tlapm ending abnormally with Failure("proof.Gen.set_expr")
---*)
