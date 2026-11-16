(*---
description: z3test's regression regressions/smt2/3754.smt2.
ref: regressions/smt2/3754.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :trace true)
(declare-fun a () Float32)
(assert (= a ((_ to_fp 8 24) roundTowardZero a)))
(check-sat-using lra)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
