(*---
description: The temporal quantifiers \EE and \AA print as such.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE temporal_quantifiers ----
THEOREM (\AA v : v = v) => \EE w : w = w
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved
    @obl: (\AA v : v = v) => (\EE w : w = w)

    @type: obligationsnumber
    @count: 1
---*)
