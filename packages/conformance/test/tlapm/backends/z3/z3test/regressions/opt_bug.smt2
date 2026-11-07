(*---
description: z3test's regression regressions/opt_bug.smt2.
ref: regressions/opt_bug.smt2
features:
  - z3test
outcome: sat
---*)
(declare-fun |ku'0'| () Int)
(declare-fun |ku'1'| () Int)
(declare-fun |ku'4'| () Int)
(declare-fun |ku'3'| () Int)
(declare-fun |ku'2'| () Int)
(assert (and (>= |ku'0'| 0) (<= |ku'0'| 1)))
(assert (= |ku'0'| 1))
(assert (and (>= |ku'1'| 0) (<= |ku'1'| 1)))
(assert (>= (+ |ku'1'| |ku'2'| |ku'3'| |ku'4'|) 1))
(assert (and (>= |ku'2'| 0) (<= |ku'2'| 1)))
(assert (>= (+ |ku'2'| |ku'3'|) 1))
(assert (and (>= |ku'3'| 0) (<= |ku'3'| 1)))
(assert (>= (+ |ku'3'| |ku'2'|) 1))
(assert (and (>= |ku'4'| 0) (<= |ku'4'| 1)))
(assert (>= (+ |ku'4'| |ku'2'| |ku'3'|) 1))
(minimize (+ |ku'0'| |ku'1'| |ku'2'| |ku'3'| |ku'4'|))
(check-sat)
(get-objectives)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    (objectives
     ((+ |ku'0'| |ku'1'| |ku'2'| |ku'3'| |ku'4'|) 2)
    )
---*)
