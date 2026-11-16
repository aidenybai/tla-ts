(*---
description: z3test's regression old-regressions/smt2/t44.smt2.
ref: old-regressions/smt2/t44.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation



(define-sort C () (_ BitVec 4))

(declare-const c1 C)
(declare-const c2 C)
(declare-const c3 C)
(declare-const c4 C)

(simplify (concat #x0 #x0 ((_ extract 3 2) c1) ((_ extract 1 0) c1)))

(simplify ((_ extract 13 2) (concat c1 c2 c3 c4)))
(simplify ((_ extract 14 12) (concat c1 c2 c3 c4)))
(simplify ((_ extract 15 12) (concat c1 c2 c3 c4)))
(simplify ((_ extract 15 13) (concat c1 c2 c3 c4)))
(simplify ((_ extract 14 12) (concat c1 c2 c3 c4)))
(simplify ((_ extract 14 10) (concat c1 c2 c3 c4)))
(simplify ((_ extract 14 10) (concat c1 (concat c2 c3) c4)))
(simplify ((_ extract 14 8) (concat c1 c2 c3 c4)))
(simplify ((_ extract 15 8) (concat c1 c2 c3 c4)))
(simplify ((_ extract 13 8) (concat c1 c2 c3 c4)))
(simplify ((_ extract 13 8) (concat ((_ extract 3 1) c1) c2 c3 c4)))

(simplify ((_ extract 3 0) #xa0))
(simplify ((_ extract 6 0) #xf0))
(simplify ((_ extract 7 4) #xf0))

(simplify (concat #x0f (concat #x0f c1)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (concat #x00 c1)
    (concat ((_ extract 1 0) c1) c2 c3 ((_ extract 3 2) c4))
    ((_ extract 2 0) c1)
    c1
    ((_ extract 3 1) c1)
    ((_ extract 2 0) c1)
    (concat ((_ extract 2 0) c1) ((_ extract 3 2) c2))
    (concat ((_ extract 2 0) c1) ((_ extract 3 2) c2))
    (concat ((_ extract 2 0) c1) c2)
    (concat c1 c2)
    (concat ((_ extract 1 0) c1) c2)
    (concat ((_ extract 2 1) c1) c2)
    #x0
    #b1110000
    #xf
    (concat #x0f0f c1)
---*)
