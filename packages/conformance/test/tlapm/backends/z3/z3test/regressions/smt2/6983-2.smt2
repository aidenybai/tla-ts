(*---
description: z3test's regression regressions/smt2/6983-2.smt2.
ref: regressions/smt2/6983-2.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(declare-const a (_ BitVec 1))
(check-sat)
(assert (not (fp.eq (fp (_ bv0 1) (_ bv0 8) (_ bv0 23)) ((_ to_fp 8 24) (bvnand (_ bv1 32) ((_ zero_extend 31) a))))))
(check-sat)

(reset)

(define-fun a () (_ BitVec 1) #b0)
(check-sat)
(assert (not (fp.eq (fp (_ bv0 1) (_ bv0 8) (_ bv0 23)) ((_ to_fp 8 24) (bvnand (_ bv1 32) ((_ zero_extend 31) a))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    sat
    sat
---*)
