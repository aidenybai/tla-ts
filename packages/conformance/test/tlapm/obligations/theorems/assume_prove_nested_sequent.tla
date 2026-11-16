(*---
description: An assumption that is itself an ASSUME ... PROVE is printed as a nested sequent in the context.
ref: src/expr/e_fmt.ml#pp_print_sequent
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_nested_sequent ----
CONSTANT P(_)
THEOREM ASSUME ASSUME NEW x PROVE P(x), NEW y PROVE P(y)
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
    @obl: ASSUME NEW CONSTANT P(_),
           ASSUME NEW CONSTANT x
           PROVE  P(x) ,
           NEW CONSTANT y
    PROVE  P(y)

    @type: obligationsnumber
    @count: 1
---*)
