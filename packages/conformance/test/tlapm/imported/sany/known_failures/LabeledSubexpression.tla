(*---
description: The module sany/known_failures/LabeledSubexpression.tla, which tlapm's tests parse with tlapm's parser and with SANY.
ref: test/sany/known_failures/LabeledSubexpression.tla
features:
  - tlapm-test
mode: obligations
outcome: proved
---*)
The SANY XML Exporter does not give enough information to convert labeled
subexpressions. Seen in the following tlaplus/examples specs:
 - specifications/ewd840/EWD840_proof.tla
 - specifications/byzpaxos/PConProof.tla
---- MODULE LabeledSubexpression ----
Inv == /\ P1 :: TRUE
       /\ P2 :: TRUE
THEOREM Inv!P1
PROOF BY DEF Inv
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:7:17:9
    @status: to be proved
    @obl: ASSUME Inv == /\ P1::TRUE
                  /\ P2::TRUE
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)
