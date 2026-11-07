(*---
description: z3test's regression old-regressions/smt2/t251.smt2.
ref: old-regressions/smt2/t251.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation

(set-option :numeral-as-real true)

(define-fun sqrt ((x Real)) Real
  (^ x (/ 1 2)))

(define-fun cbrt ((x Real)) Real
  (^ x (/ 1 3)))

(simplify (= (+ (sqrt 2) (sqrt 3) (sqrt 5))
             (sqrt (+ 10 (* 2 (sqrt 15)) (* 4 (sqrt (+ 4 (sqrt 15))))))))

(simplify (+ (sqrt 2) (sqrt 3) (sqrt 5)))
(simplify (sqrt (+ 10 (* 2 (sqrt 15)) (* 4 (sqrt (+ 4 (sqrt 15)))))))

(simplify (/ (sqrt 7)
             (sqrt (+ 5 (* 2 (sqrt 6))))))

(simplify (/ (+ (sqrt 18) (sqrt 27))
             (sqrt (+ 5 (* 2 (sqrt 6))))))

;; Some systems encode subsets of the algebraic numbers as elements of the extension field Q(\theta).
;; Example (\theta, (c_0, ..., c_n)) represents the number c_n*\theta^n + ... + c_0 where c_i's are integers
;; Suppose \theta is cbrt(3). Then, we can encode (cbrt(3), (1, 2, 3)) in Z3 as:
(simplify (+ (* 3 (^ (cbrt 3) 2)) (* 2 (cbrt 3)) 1))

(simplify (/ (sqrt (+ (root-obj (+ (^ x 3) (* (- 7) x) (- 2)) 3) 1))
             (+ (* 3 (^ (cbrt 3) 2)) (* 2 (cbrt 3)) 1)))

(simplify (/ (root-obj (+ (^ x 5) (* 11 x) 1) 1)
             (+ (* 3 (^ (cbrt 3) 2)) (* 2 (cbrt 3)) 1)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    true
    (root-obj (+ (^ x 8) (* (- 40) (^ x 6)) (* 352 (^ x 4)) (* (- 960) (^ x 2)) 576) 8)
    (root-obj (+ (^ x 8) (* (- 40) (^ x 6)) (* 352 (^ x 4)) (* (- 960) (^ x 2)) 576) 8)
    (root-obj (+ (^ x 4) (* (- 70) (^ x 2)) 49) 3)
    3.0
    (root-obj (+ (^ x 3) (* (- 3) (^ x 2)) (* (- 51) x) (- 214)) 1)
    (root-obj (+ (* 24011685629584 (^ x 18)) (* (- 2071582014204) (^ x 16)) (* 909956170104 (^ x 14)) (* (- 24455916591) (^ x 12)) (* 4220553675 (^ x 10)) (* (- 167587971) (^ x 8)) (* 3638684 (^ x 6)) (* (- 95172) (^ x 4)) (* (- 1776) (^ x 2)) 16) 4)
    (root-obj (+ (* 448816553824 (^ x 15)) (* (- 19849452942) (^ x 11)) (* 424254459 (^ x 10)) (* 250835178 (^ x 7)) (* (- 8089719) (^ x 6)) (* 110343 (^ x 5)) (* 284834 (^ x 3)) (* (- 6171) (^ x 2)) (* 33 x) 1) 1)
---*)
