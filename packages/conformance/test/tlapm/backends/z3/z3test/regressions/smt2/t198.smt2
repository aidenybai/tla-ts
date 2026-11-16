(*---
description: z3test's regression regressions/smt2/t198.smt2.
ref: regressions/smt2/t198.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation


(declare-datatypes () ((T A B)))
(declare-const x T)
(assert ((_ is A) x))
(assert ((_ is B) x))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
