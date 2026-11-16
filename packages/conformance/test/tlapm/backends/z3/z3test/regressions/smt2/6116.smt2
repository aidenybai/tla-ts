(*---
description: z3test's regression regressions/smt2/6116.smt2.
ref: regressions/smt2/6116.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-info :status sat)

(declare-fun a () Float16)
(assert (= a ((_ to_fp 5 11) RTN 65535.0 0)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
