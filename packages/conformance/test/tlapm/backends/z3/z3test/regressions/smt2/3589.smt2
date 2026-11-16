(*---
description: z3test's regression regressions/smt2/3589.smt2.
ref: regressions/smt2/3589.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :smt.arith.random_initial_value true)
;(set-option :debug_ref_count true)
(set-option :trace true)
(set-option :proof true)
(declare-fun a () Real)
(declare-fun b () Real)
(declare-fun c () Real)
(declare-fun d () Real)
(declare-fun e () Real)
(declare-fun f () Real)
(declare-fun g () Real)
(declare-fun h () Real)
(declare-fun i () Real)
(declare-fun j () Real)
(declare-fun k () Real)
(declare-fun l () Real)
(assert (= g a 0 i h))
(assert (distinct b (+ j f)))
(assert (= c (div l k e) d))
(check-sat-using qfidl)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
