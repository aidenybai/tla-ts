(*---
description: z3test's regression regressions/smt2/fp-to_sbv-14.smt2.
ref: regressions/smt2/fp-to_sbv-14.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-info :status unsat)
(set-info :source "Handcrafted by C.M. Wintersteiger")

(define-fun X () (_ FloatingPoint  8 24) ((_ to_fp 8 24) RNE (/ 244681 4194304)))
(declare-fun Y () (_ FloatingPoint  8 24))
(declare-fun R () (_ BitVec 8))

(assert (and
			(fp.eq Y X)
			(= R ((_ fp.to_sbv 8) RNE Y))			
			(not (= R #x00))
		))

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
