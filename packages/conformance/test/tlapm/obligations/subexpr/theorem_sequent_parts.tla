(*---
description: The numbered subexpressions of a named ASSUME ... PROVE theorem are its assumptions, then its goal.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE theorem_sequent_parts ----
CONSTANT A, B
THEOREM T == ASSUME A, B PROVE A /\ B
  OBVIOUS
THEOREM T!2 => T!3!1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A ,
           B 
    PROVE  A /\ B

    @type: obligation
    @id: 2
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  B => A

    @type: obligationsnumber
    @count: 2
---*)
