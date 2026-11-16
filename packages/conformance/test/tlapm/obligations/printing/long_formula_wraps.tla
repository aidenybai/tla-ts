(*---
description: A formula longer than the line width wraps onto several lines.
ref: src/expr/e_fmt.ml#pp_print_expr
mode: obligations
outcome: proved
---*)
---- MODULE long_formula_wraps ----
CONSTANT aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd
THEOREM aaaaaaaaaa = bbbbbbbbbb /\ bbbbbbbbbb = cccccccccc /\ cccccccccc = dddddddddd /\ dddddddddd = aaaaaaaaaa /\ aaaaaaaaaa = cccccccccc
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
    @obl: ASSUME NEW CONSTANT aaaaaaaaaa,
           NEW CONSTANT bbbbbbbbbb,
           NEW CONSTANT cccccccccc,
           NEW CONSTANT dddddddddd
    PROVE  aaaaaaaaaa = bbbbbbbbbb /\ bbbbbbbbbb = cccccccccc
           /\ cccccccccc = dddddddddd /\ dddddddddd = aaaaaaaaaa
           /\ aaaaaaaaaa = cccccccccc

    @type: obligationsnumber
    @count: 1
---*)
