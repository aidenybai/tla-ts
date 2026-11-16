(*---
description: The syntax corpus case "Proof Containing Jlist" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: proved
---*)
---- MODULE proofs_proof_containing_jlist ----
THEOREM TRUE
<*>
  /\ 1
  /\ \/ 2
   <+> WITNESS
     \/ 3
     \/ /\ 4,
     /\ \/ 5
     /\ 6
   <*> QED BY
     /\ 7
     /\ \/ 8,
     \/ /\ 9
     \/ 10
<*> QED BY
  \/ 11
  \/ /\ 12,
  /\ \/ 13
  /\ 14
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:9:25:11
    @status: to be proved
    @obl: ASSUME <0>_a5 ,
           \/ 11
           \/ /\ 12 ,
           /\ \/ 13
           /\ 14 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 26:3:27:11
    @status: to be proved
    @obl: ASSUME <0>_a5 
    PROVE  \/ 11
           \/ /\ 12

    @type: obligation
    @id: 3
    @loc: 28:3:29:8
    @status: to be proved
    @obl: ASSUME <0>_a5 ,
           \/ 11
           \/ /\ 12 
    PROVE  /\ \/ 13
           /\ 14

    @type: obligation
    @id: 4
    @loc: 20:12:20:14
    @status: to be proved
    @obl: ASSUME /\ 7
           /\ \/ 8 ,
           \/ /\ 9
           \/ 10 
    PROVE  /\ 1
           /\ \/ 2

    @type: obligation
    @id: 5
    @loc: 21:6:22:13
    @status: to be proved
    @obl: /\ 7
    /\ \/ 8

    @type: obligation
    @id: 6
    @loc: 23:6:24:11
    @status: to be proved
    @obl: ASSUME /\ 7
           /\ \/ 8 
    PROVE  \/ /\ 9
           \/ 10

    @type: obligation
    @id: 7
    @loc: 15:4:19:10
    @status: to be proved
    @obl: 
    Error: this WITNESS step is applied to the following goal,
    which is not an existential formula:
      /\ 1
      /\ \/ 2

    @type: obligationsnumber
    @count: 7
---*)
