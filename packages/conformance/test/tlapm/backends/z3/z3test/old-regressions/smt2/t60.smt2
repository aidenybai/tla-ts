(*---
description: z3test's regression old-regressions/smt2/t60.smt2.
ref: old-regressions/smt2/t60.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(define-sort C () (_ BitVec 8))
(define-sort W () (_ BitVec 16))
(declare-const a1 W)
(declare-const a2 W)
(declare-const a3 W)
(declare-const a4 W)
(declare-const c1 C)
(declare-const c2 C)
(declare-const c3 C)
(declare-const c4 C)

(simplify (= (concat a1 a2) (concat (concat c1 c2) (concat c3 #x00))))
(simplify (= (bvudiv a1 #x0004) (concat c1 c2)))
(simplify (= (concat (concat a1 c1) (concat c2 a2)) (concat c3 (concat a3 a4) c4)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (and (= ((_ extract 7 0) a2) #x00)
         (= ((_ extract 15 8) a2) c3)
         (= ((_ extract 7 0) a1) c2)
         (= ((_ extract 15 8) a1) c1))
    (and (= ((_ extract 9 2) a1) c2)
         (= ((_ extract 15 10) a1) ((_ extract 5 0) c1))
         (= ((_ extract 7 6) c1) #b00))
    (and (= ((_ extract 7 0) a2) c4)
         (= ((_ extract 15 8) a2) ((_ extract 7 0) a4))
         (= c2 ((_ extract 15 8) a4))
         (= c1 ((_ extract 7 0) a3))
         (= ((_ extract 7 0) a1) ((_ extract 15 8) a3))
         (= ((_ extract 15 8) a1) c3))
---*)
