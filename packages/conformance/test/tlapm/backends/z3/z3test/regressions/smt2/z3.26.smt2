(*---
description: z3test's regression regressions/smt2/z3.26.smt2.
ref: regressions/smt2/z3.26.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-option :produce-models true)

(define-fun is-power-of-two ((x (_ BitVec 4))) Bool 
  (= #x0 (bvand x (bvsub x #x1))))
(declare-const a (_ BitVec 4))
(assert 
 (not (= (is-power-of-two a) 
         (or (= a #x0) 
             (= a #x1) 
             (= a #x2) 
             (= a #x4) 
             (= a #x8)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
