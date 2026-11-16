(*---
description: z3test's regression old-regressions/smt2/t47.smt2.
ref: old-regressions/smt2/t47.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(define-sort W () (_ BitVec 8))

(declare-const c1 W)
(declare-const c2 W)
(declare-const c3 W)

(simplify ((_ rotate_left 3) c1))
(simplify ((_ rotate_left 8) c1))
(simplify ((_ rotate_left 16) c1))
(simplify ((_ rotate_left 0) c1))
(simplify ((_ rotate_left 2) #b11010))
(simplify ((_ rotate_left 5) c1))

(simplify ((_ rotate_right 3) c1))
(simplify ((_ rotate_right 5) c1))

(simplify (ext_rotate_left c1 #x03))
(simplify (ext_rotate_left c1 c2))
(simplify (ext_rotate_right c1 #x03))
(simplify (ext_rotate_right c1 c2))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (concat ((_ extract 4 0) c1) ((_ extract 7 5) c1))
    c1
    c1
    c1
    #b01011
    (concat ((_ extract 2 0) c1) ((_ extract 7 3) c1))
    (concat ((_ extract 2 0) c1) ((_ extract 7 3) c1))
    (concat ((_ extract 4 0) c1) ((_ extract 7 5) c1))
    (concat ((_ extract 4 0) c1) ((_ extract 7 5) c1))
    (ext_rotate_left c1 c2)
    (concat ((_ extract 2 0) c1) ((_ extract 7 3) c1))
    (ext_rotate_right c1 c2)
---*)
