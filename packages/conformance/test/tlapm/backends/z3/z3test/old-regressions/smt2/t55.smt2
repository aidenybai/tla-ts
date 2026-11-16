(*---
description: z3test's regression old-regressions/smt2/t55.smt2.
ref: old-regressions/smt2/t55.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(define-sort W () (_ BitVec 16))
(declare-const c1 W)

(simplify (bvudiv c1 #x0002))
(simplify (bvudiv c1 #x0001))
(simplify (bvudiv c1 #x0008))
(simplify (bvudiv c1 #x0009))

(define-sort DW () (_ BitVec 128))
(declare-const c2 DW)
(simplify (bvudiv c2 #x00000000000000000001000000000000))
(simplify (bvudiv c2 #x00000000000000001000000000000000))
(simplify (bvudiv c2 #x00000000000000010000000000000000))
(simplify (bvudiv c2 #x00000000000000100000000000000000))
(simplify (bvudiv c2 #x00000000000010000000000000000000))
(simplify (bvudiv c2 #x00000000000010000000000010000000))

(simplify (bvurem c1 #x0002))
(simplify (bvurem c1 #x0001))
(simplify (bvurem c1 #x0008))
(simplify (bvurem c1 #x0009))

(simplify (bvurem c2 #x00000000000000000001000000000000))
(simplify (bvurem c2 #x00000000000000001000000000000000))
(simplify (bvurem c2 #x00000000000000010000000000000000))
(simplify (bvurem c2 #x00000000000000100000000000000000))
(simplify (bvurem c2 #x00000000000010000000000000000000))
(simplify (bvurem c2 #x00000000000010000000000010000000))


(simplify (bvurem #x0000 c1)
          :hi-div0 false)
(simplify (bvurem #x0000 c1)     
          :hi-div0 true)

(simplify (bvurem (bvsub c1 #x0001) c1)
          :hi-div0 false)
(simplify (bvurem (bvsub c1 #x0001) c1)
          :hi-div0 true)

(simplify (bvsrem c1 #x0001))
(simplify (bvsrem c1 #x0002))
(simplify (bvsmod c1 #x0001))
(simplify (bvsrem c1 #x0000)
          :hi-div0 false)
(simplify (bvsrem c1 #x0000)
          :hi-div0 true)
(simplify (bvurem c1 #x0000)
          :hi-div0 true)
(simplify (bvsmod c1 #x0000)
          :hi-div0 true)
(simplify (bvsdiv c1 #x0000)
          :hi-div0 true)
(simplify (bvsdiv c1 #x0000)
          :hi-div0 false)
(simplify (bvudiv c1 #x0000)
          :hi-div0 true)
(simplify (bvudiv c1 #x0000)
          :hi-div0 false)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (concat #b0 ((_ extract 15 1) c1))
    c1
    (concat #b000 ((_ extract 15 3) c1))
    (bvudiv_i c1 #x0009)
    (concat #x000000000000 ((_ extract 127 48) c2))
    (concat #x000000000000000 ((_ extract 127 60) c2))
    (concat #x0000000000000000 ((_ extract 127 64) c2))
    (concat #x00000000000000000 ((_ extract 127 68) c2))
    (concat #x0000000000000000000 ((_ extract 127 76) c2))
    (bvudiv_i c2 #x00000000000010000000000010000000)
    (concat #b000000000000000 ((_ extract 0 0) c1))
    #x0000
    (concat #b0000000000000 ((_ extract 2 0) c1))
    (bvurem_i c1 #x0009)
    (concat #x00000000000000000000 ((_ extract 47 0) c2))
    (concat #x00000000000000000 ((_ extract 59 0) c2))
    (concat #x0000000000000000 ((_ extract 63 0) c2))
    (concat #x000000000000000 ((_ extract 67 0) c2))
    (concat #x0000000000000 ((_ extract 75 0) c2))
    (bvurem_i c2 #x00000000000010000000000010000000)
    (ite (= c1 #x0000) (bvurem0 #x0000) #x0000)
    #x0000
    (ite (= c1 #x0000) (bvurem0 #xffff) (bvadd #xffff c1))
    (bvadd #xffff c1)
    #x0000
    (bvsrem_i c1 #x0002)
    #x0000
    (bvsrem0 c1)
    c1
    c1
    c1
    (ite (bvsle #x0000 c1) #xffff #x0001)
    (bvsdiv0 c1)
    #xffff
    (bvudiv0 c1)
---*)
