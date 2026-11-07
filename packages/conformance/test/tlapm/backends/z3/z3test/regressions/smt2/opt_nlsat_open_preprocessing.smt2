(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_preprocessing.smt2.
ref: regressions/smt2/opt_nlsat_open_preprocessing.smt2
features:
  - z3test
outcome: sat
---*)
; The best Boolean branch has an open limit sqrt(3).
(set-option :opt.optsmt_bisect_rounds 8)
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const p Bool)
(assert (or (and p (< (* x x) 2.0))
            (and (not p) (< (* x x) 3.0))))
(maximize x)
(check-sat)
(get-objectives)

(reset)
; Preprocessing may express x*y=1 as division. The limit query must use
; the purified polynomial goal: sup(x)=1/sqrt(2), not attained.
(set-option :opt.optsmt_bisect_rounds 8)
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const y Real)
(assert (= (* x y) 1.0))
(assert (> y 0.0))
(assert (> (* y y) 2.0))
(maximize x)
(check-sat)
(get-objectives)

(reset)
; Switching from p to not p must replace the open sqrt(2)-epsilon bound
; with the attained maximum 2, rather than reuse the previous certificate.
(set-option :opt.optsmt_bisect_rounds 8)
(set-option :opt.optsmt_nlsat_supremum_rlimit 1000000)
(declare-const x Real)
(declare-const p Bool)
(assert (=> p (< (* x x) 2.0)))
(assert (=> (not p) (<= (* x x) 4.0)))
(maximize x)
(check-sat-assuming (p))
(get-objectives)
(check-sat-assuming ((not p)))
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 3)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (* 2 (^ x 2)) (- 1)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
    )
    sat
    (objectives
     (x 2)
    )
---*)
