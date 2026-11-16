(*---
description: A PICK step without a proof is missing, so the run is incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE pick_without_proof ----
CONSTANT P(_)
THEOREM ASSUME \E x : P(x) PROVE TRUE
<1> PICK y : P(y)
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           NEW CONSTANT y,
           P(y) 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./pick_without_proof.tla", line 10, characters 1-17
    File "./pick_without_proof.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "pick_without_proof": 1 missing, 0 omitted proof step(s).
---*)
