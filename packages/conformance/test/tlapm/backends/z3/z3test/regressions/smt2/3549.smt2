(*---
description: z3test's regression regressions/smt2/3549.smt2.
ref: regressions/smt2/3549.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :trace true)
(declare-fun a () (_ FloatingPoint 11 53))
(declare-fun b () (_ FloatingPoint 8 24))
(assert (distinct b ((_ to_fp 8 24) RTP a)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
