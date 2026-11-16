(*---
description: z3test's regression old-regressions/smt2/t56.smt2.
ref: old-regressions/smt2/t56.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(define-sort W () (_ BitVec 16))
(declare-const c1 W)

(simplify (bvsdiv c1 #x0001))
(simplify (bvudiv c1 #x0001))
(simplify (bvurem c1 #x0001))
(simplify (bvsrem c1 #x0001))
(simplify (bvsmod c1 #x0001))

(define-fun bvsmod_def ((s (_ BitVec 16)) (t (_ BitVec 16))) (_ BitVec 16)
      (let ((msb_s ((_ extract 15 15) s))
            (msb_t ((_ extract 15 15) t)))
        (let ((abs_s (ite (= msb_s #b0) s (bvneg s)))
              (abs_t (ite (= msb_t #b0) t (bvneg t))))
          (let ((u (bvurem abs_s abs_t)))
            (ite (= u (_ bv0 16))
                 u
            (ite (and (= msb_s #b0) (= msb_t #b0))
                 u
            (ite (and (= msb_s #b1) (= msb_t #b0))
                 (bvadd (bvneg u) t)
            (ite (and (= msb_s #b0) (= msb_t #b1))
                 (bvadd u t)
                 (bvneg u)))))))))
(simplify (bvsmod_def c1 #x0001))

(echo "bvmul...")

(simplify (bvmul c1 #x0001))
(simplify (bvmul c1 #x0002)
                 :mul2concat true)
(simplify (bvmul c1 #x0003)
                 :mul2concat true)
(simplify (bvmul c1 #x0004)
                 :mul2concat true)
(simplify (bvmul c1 #x0008)
                 :mul2concat true)

(declare-const a (_ BitVec 16))
(assert (not (= (bvsmod_def a #x0001) #x0000)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    c1
    c1
    #x0000
    #x0000
    #x0000
    #x0000
    bvmul...
    c1
    (concat ((_ extract 14 0) c1) #b0)
    (bvmul #x0003 c1)
    (concat ((_ extract 13 0) c1) #b00)
    (concat ((_ extract 12 0) c1) #b000)
    unsat
---*)
