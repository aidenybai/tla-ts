(*---
description: DEFINE may introduce several step definitions at once, with parameters.
ref: src/proof/p_parser.ml#prestep
mode: obligations
outcome: proved
---*)
---- MODULE step_define_keyword ----
CONSTANT c
THEOREM c = c
<1> DEFINE F == c  G(a) == a
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           F == c,
           G(a) == a
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)
