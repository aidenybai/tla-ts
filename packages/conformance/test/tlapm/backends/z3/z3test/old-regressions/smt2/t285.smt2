(*---
description: z3test's regression old-regressions/smt2/t285.smt2.
ref: old-regressions/smt2/t285.smt2
features:
  - z3test
outcome: unsat
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-option :auto-config true)
(set-info :source | KeYmaera example: TRM-essentials-4, node 12210
Andre Platzer and Edmund M. Clarke. Formal verification of curved flight collision avoidance maneuvers: A case study. In Ana Cavalcanti and Dennis Dams, editors, 16th International Symposium on Formal Methods, FM, Eindhoven, Netherlands, Proceedings, volume 5850 of LNCS, pages 547(- 562.) Springer, 2009.
 |)
(set-info :smt-lib-version 2.0)
(declare-const d1uscore4dollarsk Real)
(declare-const omuscore3dollarsk Real)
(declare-const x2uscore4dollarsk Real)
(declare-const c2uscore2dollarsk Real)
(declare-const d2uscore4dollarsk Real)
(declare-const x1uscore4dollarsk Real)
(declare-const c1uscore2dollarsk Real)
(declare-const e1uscore4dollarsk Real)
(declare-const y2uscore4dollarsk Real)
(declare-const e2uscore4dollarsk Real)
(declare-const y1uscore4dollarsk Real)
(declare-const f1uscore4dollarsk Real)
(declare-const z2uscore4dollarsk Real)
(declare-const f2uscore4dollarsk Real)
(declare-const z1uscore4dollarsk Real)
(declare-const g1uscore4dollarsk Real)
(declare-const u2uscore4dollarsk Real)
(declare-const g2uscore4dollarsk Real)
(declare-const u1uscore4dollarsk Real)
(declare-const x1uscore3dollarsk Real)
(declare-const y1uscore3dollarsk Real)
(declare-const x2uscore3dollarsk Real)
(declare-const y2uscore3dollarsk Real)
(declare-const protectedzone Real)
(declare-const z1uscore3dollarsk Real)
(declare-const z2uscore3dollarsk Real)
(declare-const u1uscore3dollarsk Real)
(declare-const u2uscore3dollarsk Real)
(declare-const x1uscore2dollarsk Real)
(declare-const y1uscore2dollarsk Real)
(declare-const x2uscore2dollarsk Real)
(declare-const y2uscore2dollarsk Real)
(declare-const z1uscore2dollarsk Real)
(declare-const z2uscore2dollarsk Real)
(declare-const u1uscore2dollarsk Real)
(declare-const u2uscore2dollarsk Real)
(declare-const x1 Real)
(declare-const y1 Real)
(declare-const x2 Real)
(declare-const y2 Real)
(declare-const z1 Real)
(declare-const z2 Real)
(declare-const u1 Real)
(declare-const u2 Real)
(assert (not (forall ((y2uscore2dollarsk Real)) (forall ((y1uscore2dollarsk Real)) (forall ((x2uscore2dollarsk Real)) (forall ((x1uscore2dollarsk Real)) (forall ((z2uscore2dollarsk Real)) (forall ((z1uscore2dollarsk Real)) (forall ((u2uscore2dollarsk Real)) (forall ((u1uscore2dollarsk Real)) (forall ((x1uscore3dollarsk Real)) (forall ((x2uscore3dollarsk Real)) (forall ((y1uscore3dollarsk Real)) (forall ((y2uscore3dollarsk Real)) (forall ((z1uscore3dollarsk Real)) (forall ((z2uscore3dollarsk Real)) (forall ((u1uscore3dollarsk Real)) (forall ((u2uscore3dollarsk Real)) (forall ((c1uscore2dollarsk Real)) (forall ((c2uscore2dollarsk Real)) (forall ((omuscore3dollarsk Real)) (forall ((g2uscore4dollarsk Real)) (forall ((g1uscore4dollarsk Real)) (forall ((u1uscore4dollarsk Real)) (forall ((u2uscore4dollarsk Real)) (forall ((d2uscore4dollarsk Real)) (forall ((d1uscore4dollarsk Real)) (forall ((x1uscore4dollarsk Real)) (forall ((x2uscore4dollarsk Real)) (forall ((e2uscore4dollarsk Real)) (forall ((e1uscore4dollarsk Real)) (forall ((y1uscore4dollarsk Real)) (forall ((y2uscore4dollarsk Real)) (forall ((f2uscore4dollarsk Real)) (forall ((f1uscore4dollarsk Real)) (forall ((z1uscore4dollarsk Real)) (forall ((z2uscore4dollarsk Real)) (=> (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (and (= d1uscore4dollarsk (* (- omuscore3dollarsk) (- x2uscore4dollarsk c2uscore2dollarsk)) ) (= d2uscore4dollarsk (* omuscore3dollarsk (- x1uscore4dollarsk c1uscore2dollarsk)) )) (= e1uscore4dollarsk (* (- omuscore3dollarsk) (- y2uscore4dollarsk c2uscore2dollarsk)) )) (= e2uscore4dollarsk (* omuscore3dollarsk (- y1uscore4dollarsk c1uscore2dollarsk)) )) (= f1uscore4dollarsk (* (- omuscore3dollarsk) (- z2uscore4dollarsk c2uscore2dollarsk)) )) (= f2uscore4dollarsk (* omuscore3dollarsk (- z1uscore4dollarsk c1uscore2dollarsk)) )) (= g1uscore4dollarsk (* (- omuscore3dollarsk) (- u2uscore4dollarsk c2uscore2dollarsk)) )) (= g2uscore4dollarsk (* omuscore3dollarsk (- u1uscore4dollarsk c1uscore2dollarsk)) )) (>= (+ (* (- x1uscore3dollarsk y1uscore3dollarsk) (- x1uscore3dollarsk y1uscore3dollarsk)) (* (- x2uscore3dollarsk y2uscore3dollarsk) (- x2uscore3dollarsk y2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- y1uscore3dollarsk z1uscore3dollarsk) (- y1uscore3dollarsk z1uscore3dollarsk)) (* (- y2uscore3dollarsk z2uscore3dollarsk) (- y2uscore3dollarsk z2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1uscore3dollarsk z1uscore3dollarsk) (- x1uscore3dollarsk z1uscore3dollarsk)) (* (- x2uscore3dollarsk z2uscore3dollarsk) (- x2uscore3dollarsk z2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1uscore3dollarsk u1uscore3dollarsk) (- x1uscore3dollarsk u1uscore3dollarsk)) (* (- x2uscore3dollarsk u2uscore3dollarsk) (- x2uscore3dollarsk u2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- y1uscore3dollarsk u1uscore3dollarsk) (- y1uscore3dollarsk u1uscore3dollarsk)) (* (- y2uscore3dollarsk u2uscore3dollarsk) (- y2uscore3dollarsk u2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- z1uscore3dollarsk u1uscore3dollarsk) (- z1uscore3dollarsk u1uscore3dollarsk)) (* (- z2uscore3dollarsk u2uscore3dollarsk) (- z2uscore3dollarsk u2uscore3dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1uscore2dollarsk y1uscore2dollarsk) (- x1uscore2dollarsk y1uscore2dollarsk)) (* (- x2uscore2dollarsk y2uscore2dollarsk) (- x2uscore2dollarsk y2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- y1uscore2dollarsk z1uscore2dollarsk) (- y1uscore2dollarsk z1uscore2dollarsk)) (* (- y2uscore2dollarsk z2uscore2dollarsk) (- y2uscore2dollarsk z2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1uscore2dollarsk z1uscore2dollarsk) (- x1uscore2dollarsk z1uscore2dollarsk)) (* (- x2uscore2dollarsk z2uscore2dollarsk) (- x2uscore2dollarsk z2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1uscore2dollarsk u1uscore2dollarsk) (- x1uscore2dollarsk u1uscore2dollarsk)) (* (- x2uscore2dollarsk u2uscore2dollarsk) (- x2uscore2dollarsk u2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- y1uscore2dollarsk u1uscore2dollarsk) (- y1uscore2dollarsk u1uscore2dollarsk)) (* (- y2uscore2dollarsk u2uscore2dollarsk) (- y2uscore2dollarsk u2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- z1uscore2dollarsk u1uscore2dollarsk) (- z1uscore2dollarsk u1uscore2dollarsk)) (* (- z2uscore2dollarsk u2uscore2dollarsk) (- z2uscore2dollarsk u2uscore2dollarsk))) (* protectedzone protectedzone) )) (>= (+ (* (- x1 y1) (- x1 y1)) (* (- x2 y2) (- x2 y2))) (* protectedzone protectedzone) )) (>= (+ (* (- y1 z1) (- y1 z1)) (* (- y2 z2) (- y2 z2))) (* protectedzone protectedzone) )) (>= (+ (* (- x1 z1) (- x1 z1)) (* (- x2 z2) (- x2 z2))) (* protectedzone protectedzone) )) (>= (+ (* (- x1 u1) (- x1 u1)) (* (- x2 u2) (- x2 u2))) (* protectedzone protectedzone) )) (>= (+ (* (- y1 u1) (- y1 u1)) (* (- y2 u2) (- y2 u2))) (* protectedzone protectedzone) )) (>= (+ (* (- z1 u1) (- z1 u1)) (* (- z2 u2) (- z2 u2))) (* protectedzone protectedzone) )) (>= (+ (* (* 2. (+ e1uscore4dollarsk (* (- 1.) g1uscore4dollarsk))) (+ (* (- 1.) u1uscore4dollarsk) y1uscore4dollarsk)) (* (* 2. (+ e2uscore4dollarsk (* (- 1.) g2uscore4dollarsk))) (+ (* (- 1.) u2uscore4dollarsk) y2uscore4dollarsk))) 0. )))))))))))))))))))))))))))))))))))))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
