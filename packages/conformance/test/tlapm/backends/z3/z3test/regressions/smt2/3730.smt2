(*---
description: z3test's regression regressions/smt2/3730.smt2.
ref: regressions/smt2/3730.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic ALL)
(set-option :proof true)
(declare-fun _substvar_3_ () Bool)
(check-sat-using (then simplify qe2))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
