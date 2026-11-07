(*---
description: z3test's regression regressions/smt2/2417.smt2.
ref: regressions/smt2/2417.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :produce-models true)
(set-option :model_validate true)
(set-logic ALL)
(define-fun s2 () Int 2)
(define-fun s4 () Int 0)
(define-fun s5 () Int 1)
(declare-fun s0 () (Seq (_ BitVec 16)))
(define-fun s1 () Int (seq.len s0))
(define-fun s3 () Bool (>= s1 s2))
(define-fun s6 () (Seq (_ BitVec 16)) (seq.extract s0 s4 s5))
(define-fun s7 () Int (- s1 s5))
(define-fun s8 () (Seq (_ BitVec 16)) (seq.extract s0 s7 s5))
(define-fun s9 () Bool (distinct s6 s8))
(define-fun s10 () Bool (and s3 s9))
(assert s10)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
