(*---
description: A quantifier over a tuple of bound variables is printed after tlapm turns it into ordinary bound variables.
ref: src/expr/e_tuply_declarations.ml
mode: obligations
outcome: proved
---*)
---- MODULE quantifier_over_tuple ----
CONSTANT S
THEOREM \A <<a, b>> \in S \X S : a = a
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
    @obl: ASSUME NEW CONSTANT S
    PROVE  \A a \in S, b \in S : a = a

    @type: obligationsnumber
    @count: 1
---*)
