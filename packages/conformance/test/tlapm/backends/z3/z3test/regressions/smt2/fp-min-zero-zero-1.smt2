(*---
description: z3test's regression regressions/smt2/fp-min-zero-zero-1.smt2.
ref: regressions/smt2/fp-min-zero-zero-1.smt2
features:
  - z3test
outcome: unsat
---*)
; Copyright (c) 2015 Microsoft Corporation

(set-logic QF_FP)
(set-info :status unsat)

(define-sort FPN () (_ FloatingPoint 11 53))
(declare-const x FPN)

(assert (= x (fp.min (_ -zero 11 53) (_ +zero 11 53))))

(assert (not (or (= x (_ -zero 11 53))
				 (= x (_ +zero 11 53)))))

(check-sat)
(check-sat-using smt)
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
