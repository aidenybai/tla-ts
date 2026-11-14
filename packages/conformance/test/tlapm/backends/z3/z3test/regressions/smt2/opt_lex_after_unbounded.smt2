(*---
description: z3test's regression regressions/smt2/opt_lex_after_unbounded.smt2.
ref: regressions/smt2/opt_lex_after_unbounded.smt2
features:
  - z3test
outcome: sat
---*)
; After an unbounded lexicographic objective, a later objective takes the
; limit of its optima as the unbounded objective grows. Here y stays at most
; 10 however large x is, so y is 10 and not an open interval.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const y Real)
(assert (<= y 10.0))
(assert (>= (- x y) 0.0))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(reset)
; The same with a nonlinear unbounded objective, proven by nlsat projection.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const y Real)
(assert (>= (* x x) 4.0))
(assert (<= y 10.0))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(reset)
; Minimization to -oo first; the second objective is still determined.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const y Real)
(assert (<= y 10.0))
(assert (<= (+ x y) 0.0))
(minimize x)
(maximize y)
(check-sat)
(get-objectives)

(reset)
; A determined limit is committed before the next objective: z <= y - 3 gives 7.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const y Real)
(declare-const z Real)
(assert (<= y 10.0))
(assert (>= x y))
(assert (<= z (- y 3.0)))
(maximize x)
(maximize y)
(maximize z)
(check-sat)
(get-objectives)

(reset)
; A better value of y only in a region where x is bounded does not count.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const y Real)
(declare-const b Bool)
(assert (=> b (and (<= y 20.0) (<= x 100.0))))
(assert (=> (not b) (<= y 10.0)))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(reset)
; Integer objectives.
(set-option :opt.priority lex)
(declare-const x Int)
(declare-const y Int)
(assert (<= y 10))
(assert (>= x y))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(reset)
; A soft objective after an unbounded objective keeps its interval.
(set-option :opt.priority lex)
(declare-const x Real)
(declare-const p Bool)
(assert (=> p (<= x 5.0)))
(maximize x)
(assert-soft p)
(check-sat)
(get-objectives)

(reset)
; With the search disabled, later objectives keep unrestricted intervals.
(set-option :opt.priority lex)
(set-option :opt.optsmt_lex_after_unbounded false)
(declare-const x Real)
(declare-const y Real)
(assert (<= y 10.0))
(assert (>= x y))
(maximize x)
(maximize y)
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x oo)
     (y 10)
    )
    sat
    (objectives
     (x oo)
     (y 10)
    )
    sat
    (objectives
     (x (* (- 1) oo))
     (y 10)
    )
    sat
    (objectives
     (x oo)
     (y 10)
     (z 7)
    )
    sat
    (objectives
     (x oo)
     (y 10)
    )
    sat
    (objectives
     (x oo)
     (y 10)
    )
    sat
    (objectives
     (x oo)
     (  (interval 0 1))
    )
    sat
    (objectives
     (x oo)
     (y  (interval (* (- 1) oo) oo))
    )
---*)
