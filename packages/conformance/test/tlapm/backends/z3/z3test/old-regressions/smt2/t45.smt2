(*---
description: z3test's regression old-regressions/smt2/t45.smt2.
ref: old-regressions/smt2/t45.smt2
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

(simplify ((_ extract 2 1) ((_ extract 2 0) c1)))
(simplify ((_ extract 2 1) ((_ extract 3 1) c1)))

(simplify ((_ extract 3 2) (ite (= c1 c2) c3 c4)))

(simplify ((_ extract 3 0) (ite (= c1 c2) #xf0 #x00)))

(simplify ((_ extract 2 0) (bvadd c1 c2)))
(simplify ((_ extract 2 1) (bvadd c1 c2)))
(simplify ((_ extract 2 0) (bvmul c1 c2)))
(simplify ((_ extract 2 1) (bvmul c1 c2)))
(simplify ((_ extract 2 0) (bvsub c1 c2)))
(simplify ((_ extract 2 1) (bvsub c1 c2)))
(simplify ((_ extract 2 0) (bvand c1 c2)))
(simplify ((_ extract 2 1) (bvand c1 c2)))
(simplify ((_ extract 2 0) (bvnot c1)))
(simplify ((_ extract 2 1) (bvnot c1)))
(simplify ((_ extract 2 0) (bvor c1 c2)))
(simplify ((_ extract 2 1) (bvor c1 c2)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    ((_ extract 2 1) c1)
    ((_ extract 3 2) c1)
    (ite (= c1 c2) ((_ extract 3 2) c3) ((_ extract 3 2) c4))
    #x0
    (bvadd ((_ extract 2 0) c1) ((_ extract 2 0) c2))
    ((_ extract 2 1) (bvadd c1 c2))
    (bvmul ((_ extract 2 0) c1) ((_ extract 2 0) c2))
    ((_ extract 2 1) (bvmul c1 c2))
    (bvadd ((_ extract 2 0) c1) (bvmul #b111 ((_ extract 2 0) c2)))
    ((_ extract 2 1) (bvadd c1 (bvmul #xf c2)))
    (bvnot (bvor (bvnot ((_ extract 2 0) c1)) (bvnot ((_ extract 2 0) c2))))
    (bvnot (bvor (bvnot ((_ extract 2 1) c1)) (bvnot ((_ extract 2 1) c2))))
    (bvnot ((_ extract 2 0) c1))
    (bvnot ((_ extract 2 1) c1))
    (bvor ((_ extract 2 0) c1) ((_ extract 2 0) c2))
    (bvor ((_ extract 2 1) c1) ((_ extract 2 1) c2))
---*)
