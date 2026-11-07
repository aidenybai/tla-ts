(*---
description: z3test's regression old-regressions/smt2/t54.smt2.
ref: old-regressions/smt2/t54.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(simplify (bvsdiv #x0d #x03))
(simplify (bvsdiv #xfd #x03))
(simplify (bvsdiv #xf0 #x03))
(simplify (bvsdiv #x8d #x03))
(simplify (bvsdiv #x0d #xfd))
(simplify (bvsdiv #xfd #xfd))
(simplify (bvsdiv #xf0 #xfd))
(simplify (bvsdiv #x8d #xfd))
(echo "----")
(simplify (bvudiv #x0d #x03))
(simplify (bvudiv #xfd #x03))
(simplify (bvudiv #xf0 #x03))
(simplify (bvudiv #x8d #x03))
(simplify (bvudiv #x0d #xfd))
(simplify (bvudiv #xfd #xfd))
(simplify (bvudiv #xf0 #xfd))
(simplify (bvudiv #x8d #xfd))
(echo "----")
(simplify (bvsrem #x0d #x03))
(simplify (bvsrem #xfd #x03))
(simplify (bvsrem #xf0 #x03))
(simplify (bvsrem #x8d #x03))
(simplify (bvsrem #x0d #xfd))
(simplify (bvsrem #xfd #xfd))
(simplify (bvsrem #xf0 #xfd))
(simplify (bvsrem #x8d #xfd))
(echo "----")
(simplify (bvurem #x0d #x03))
(simplify (bvurem #xfd #x03))
(simplify (bvurem #xf0 #x03))
(simplify (bvurem #x8d #x03))
(simplify (bvurem #x0d #xfd))
(simplify (bvurem #xfd #xfd))
(simplify (bvurem #xf0 #xfd))
(simplify (bvurem #x8d #xfd))
(echo "----")
(simplify (bvsmod #x0d #x03))
(simplify (bvsmod #xfd #x03))
(simplify (bvsmod #xf0 #x03))
(simplify (bvsmod #x8d #x03))
(simplify (bvsmod #x0d #xfd))
(simplify (bvsmod #xfd #xfd))
(simplify (bvsmod #xf0 #xfd))
(simplify (bvsmod #x8d #xfd))

(define-fun bvsmod_def ((s (_ BitVec 8)) (t (_ BitVec 8))) (_ BitVec 8)
      (let ((msb_s ((_ extract 7 7) s))
            (msb_t ((_ extract 7 7) t)))
        (let ((abs_s (ite (= msb_s #b0) s (bvneg s)))
              (abs_t (ite (= msb_t #b0) t (bvneg t))))
          (let ((u (bvurem abs_s abs_t)))
            (ite (= u (_ bv0 8))
                 u
            (ite (and (= msb_s #b0) (= msb_t #b0))
                 u
            (ite (and (= msb_s #b1) (= msb_t #b0))
                 (bvadd (bvneg u) t)
            (ite (and (= msb_s #b0) (= msb_t #b1))
                 (bvadd u t)
                 (bvneg u)))))))))

(echo "----")
(simplify (bvsmod #xfd #x03))
(simplify (bvsmod_def #xfd #x03))

(*--- recorded
all:
  exit: 0
  transcript: |-
    #x04
    #xff
    #xfb
    #xda
    #xfc
    #x01
    #x05
    #x26
    ----
    #x04
    #x54
    #x50
    #x2f
    #x00
    #x01
    #x00
    #x00
    ----
    #x01
    #x00
    #xff
    #xff
    #x01
    #x00
    #xff
    #xff
    ----
    #x01
    #x01
    #x00
    #x00
    #x0d
    #x00
    #xf0
    #x8d
    ----
    #x01
    #x00
    #x02
    #x02
    #xfe
    #x00
    #xff
    #xff
    ----
    #x00
    #x00
---*)
