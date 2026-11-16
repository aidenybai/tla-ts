(*---
description: The syntax corpus case "Proof Level Change Terminates Jlist" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_proof_level_change_terminates_jlist ----
THEOREM TRUE
<*> /\ 1
    /\ 2
      <+> QED BY
        \/ 1
        \/ 2
          <*> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 14:15:14:17
    @status: to be proved
    @obl: ASSUME \/ 1
           \/ 2 
    PROVE  /\ 1
           /\ 2

    @type: obligation
    @id: 3
    @loc: 15:9:16:13
    @status: to be proved
    @obl: \/ 1
    \/ 2

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./proofs_proof_level_change_terminates_jlist.tla", line 17, characters 11-17
    File "./proofs_proof_level_change_terminates_jlist.tla", line 10, character 1 to line 18, character 4:
    [ERROR]: Proof incomplete in module "proofs_proof_level_change_terminates_jlist": 1 missing, 0 omitted proof step(s).
---*)
