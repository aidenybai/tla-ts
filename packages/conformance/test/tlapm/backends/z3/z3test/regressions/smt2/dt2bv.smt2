(*---
description: z3test's regression regressions/smt2/dt2bv.smt2.
ref: regressions/smt2/dt2bv.smt2
features:
  - z3test
outcome: any
---*)
; Copyright (c) 2016 Microsoft Corporation
; Loosely based on https://github.com/Z3Prover/z3/issues/693

(declare-datatypes () ((P (P1) (P0) (P3))))
(declare-fun n3_p () P)
(declare-fun n2_p () P)
(declare-fun n1_p () P)
(declare-fun n0_p () P)
(declare-fun imbalance () Int)
(assert (let ((a!1 (+ 0
              (ite (= n0_p P0) 1 0)
              (ite (= n1_p P0) 1 0)
              (ite (= n2_p P0) 1 0)
              (ite (= n3_p P0) 1 0)))
      (a!2 (+ 0
              (ite (= n0_p P1) 1 0)
              (ite (= n1_p P1) 1 0)
              (ite (= n2_p P1) 1 0)
              (ite (= n3_p P1) 1 0))))
(let ((a!3 (- (ite (and true (>= a!1 a!2)) a!1 a!2)
              (ite (and true (<= a!1 a!2)) a!1 a!2))))
  (= imbalance a!3))))

(assert ((_ is P1) n0_p))
(assert ((_ is P3) n0_p))

(assert (forall ((x P) (y Int) (z Bool))
    (=> z (= x P0))))

(apply dt2bv)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (let ((a!1 (+ 0
                    (ite (= n0_p!0 #b01) 1 0)
                    (ite (= n1_p!1 #b01) 1 0)
                    (ite (= n2_p!2 #b01) 1 0)
                    (ite (= n3_p!3 #b01) 1 0)))
            (a!2 (+ 0
                    (ite (= n0_p!0 #b00) 1 0)
                    (ite (= n1_p!1 #b00) 1 0)
                    (ite (= n2_p!2 #b00) 1 0)
                    (ite (= n3_p!3 #b00) 1 0))))
      (let ((a!3 (- (ite (and true (>= a!1 a!2)) a!1 a!2)
                    (ite (and true (<= a!1 a!2)) a!1 a!2))))
        (= imbalance a!3)))
      (= n0_p!0 #b00)
      (= n0_p!0 #b10)
      (forall ((x (_ BitVec 2)) (y Int) (z Bool))
        (=> (bvule x #b10) (=> z (= x #b01))))
      (bvule n0_p!0 #b10)
      (bvule n1_p!1 #b10)
      (bvule n2_p!2 #b10)
      (bvule n3_p!3 #b10)
      :precision precise :depth 1)
    )
---*)
