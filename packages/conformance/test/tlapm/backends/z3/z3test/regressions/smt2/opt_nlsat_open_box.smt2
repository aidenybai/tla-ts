(*---
description: z3test's regression regressions/smt2/opt_nlsat_open_box.smt2.
ref: regressions/smt2/opt_nlsat_open_box.smt2
features:
  - z3test
outcome: sat
---*)
; Box mode returns independent feasible models for two unattained limits.
; Selecting another model must not overwrite either certified bound.
(set-option :opt.priority box)
(declare-const x Real)
(assert (< (* x x) 2.0))
(maximize x)
(minimize x)
(check-sat)
(get-objectives)
(check-sat)
(get-objectives)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
     (x (+ (root-obj (+ (^ x 2) (- 2)) 1) epsilon))
    )
    sat
    (objectives
     (x (+ (root-obj (+ (^ x 2) (- 2)) 2) (* (- 1.0) epsilon)))
     (x (+ (root-obj (+ (^ x 2) (- 2)) 1) epsilon))
    )
    unsat
---*)
