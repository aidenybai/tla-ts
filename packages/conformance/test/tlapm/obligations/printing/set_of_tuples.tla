(*---
description: A set map over a tuple of bound variables prints after tlapm turns the tuple into ordinary bound variables.
ref: src/expr/e_tuply_declarations.ml
mode: obligations
outcome: proved
---*)
---- MODULE set_of_tuples ----
CONSTANT S
THEOREM {a : <<a, b>> \in S \X S} \subseteq S
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
    PROVE  {a : a \in S, b \in S} \subseteq S

    @type: obligationsnumber
    @count: 1
---*)
