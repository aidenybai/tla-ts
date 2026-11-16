(*---
description: z3test's regression regressions/smt2/2531.smt2.
ref: regressions/smt2/2531.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun x () String)
(declare-fun y () String)
(declare-fun z () String)
(assert
  (not
    (=
      (str.contains y (str.replace "A" (str.replace (str.++ x z) x "") z))
      (str.contains y "A")
    )
  )
)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
