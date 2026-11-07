(*---
description: The syntax corpus case "Proof by QED" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE proofs_proof_by_qed ----
COROLLARY TRUE
PROOF <1>a QED BY <1>a, <1>a
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:16:12:18
    @status: to be proved
    @obl: ASSUME TRUE ,
           TRUE 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:19:12:23
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 3
    @loc: 12:25:12:29
    @status: to be proved
    @obl: ASSUME TRUE 
    PROVE  TRUE

    @type: warning
    @msg: File "./proofs_proof_by_qed.tla", line 12, characters 19-22 :
    Warning: <1>a does not introduce any assumptions. It does not make sense to use it here.

    @type: warning
    @msg: File "./proofs_proof_by_qed.tla", line 12, characters 25-28 :
    Warning: <1>a does not introduce any assumptions. It does not make sense to use it here.

    @type: obligationsnumber
    @count: 3
---*)
