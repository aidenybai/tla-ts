(*---
description: z3test's regression regressions/smt2/7489.smt2.
ref: regressions/smt2/7489.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_NRA)

( declare-const a_t0_0   Real)
( declare-const a_t1_0   Real)
( declare-const a_t2_0   Real)
( declare-const l_t0t1_0 Real)
( declare-const r_t0t1_0 Real)
( declare-const l_t1t2_0 Real)
( declare-const r_t1t2_0 Real)
( declare-const l_t2t0_0 Real)
( declare-const r_t2t0_0 Real)

( declare-const a_t0_1   Real)
( declare-const a_t1_1   Real)
( declare-const a_t2_1   Real)
( declare-const l_t2t0_1 Real)
( declare-const r_t2t0_1 Real)
( declare-const l_t1t2_1 Real)
( declare-const r_t1t2_1 Real)
( declare-const l_t0t1_1 Real)
( declare-const r_t0t1_1 Real)
( declare-const from_1   Real)
( declare-const   to_1   Real)
( declare-const payout_1 Real)

( declare-const a_t0_2   Real)
( declare-const a_t1_2   Real)
( declare-const a_t2_2   Real)
( declare-const l_t2t0_2 Real)
( declare-const r_t2t0_2 Real)
( declare-const l_t1t2_2 Real)
( declare-const r_t1t2_2 Real)
( declare-const l_t0t1_2 Real)
( declare-const r_t0t1_2 Real)
( declare-const from_2   Real)
( declare-const   to_2   Real)
( declare-const payout_2 Real)

( declare-const a_t0_3   Real)
( declare-const a_t1_3   Real)
( declare-const a_t2_3   Real)
( declare-const l_t2t0_3 Real)
( declare-const r_t2t0_3 Real)
( declare-const l_t1t2_3 Real)
( declare-const r_t1t2_3 Real)
( declare-const l_t0t1_3 Real)
( declare-const r_t0t1_3 Real)
( declare-const from_3   Real)
( declare-const   to_3   Real)
( declare-const payout_3 Real)

; user assertions
(assert ( = a_t0_0 (/ 6 1)))
(assert ( = a_t1_0 (/ 6 1)))
(assert ( = a_t2_0 (/ 6 1)))
(assert (>= a_t0_1 0))
(assert (>= a_t1_1 0))
(assert (>= a_t2_1 0))
(assert (>= a_t0_2 0))
(assert (>= a_t1_2 0))
(assert (>= a_t2_2 0))
(assert (>= a_t0_3 0))
(assert (>= a_t1_3 0))
(assert (>= a_t2_3 0))

; HERE ARE THE VARIABLES OF INTEREST:
;(assert (= a_t0_3 8))
;(assert (= a_t1_3 8))
;(assert (= a_t2_3 8))
(assert (= (+ a_t0_3 a_t1_3 a_t2_3) 24))

; amm assertions
(assert (= (/ 18 1) l_t0t1_0))
(assert (= (/ 8 1)  r_t0t1_0))
(assert (= (/ 18 1) l_t1t2_0))
(assert (= (/ 8 1)  r_t1t2_0))
(assert (= (/ 18 1) l_t2t0_0))
(assert (= (/ 8 1)  r_t2t0_0))

;txn assertions
(assert (> from_1 0))
(assert (> from_2 0))
(assert (> from_3 0))
(assert (> to_1 0))
(assert (> to_2 0))
(assert (> to_3 0))

(assert (= 
            payout_1
            (/ 
               (* from_1 l_t1t2_0)
               (+ from_1 r_t1t2_0))
        )
)
(assert (ite 
    (and (>= to_1 0) (<= to_1 payout_1))
    (and 
        (= l_t1t2_1 (- l_t1t2_0 payout_1))
        (= r_t1t2_1 (+ r_t1t2_0 from_1))
        (= a_t1_1 (+ a_t1_0 payout_1))
        (= a_t2_1 (- a_t2_0 from_1))
    )
    (and
        (= l_t1t2_1 l_t1t2_0 )
        (= r_t1t2_1 r_t1t2_0 )
        (= a_t1_1 a_t1_0 )
        (= a_t2_1 a_t2_0 )
    )
))

(assert (= 
            payout_2
            (/ 
               (* from_2 l_t2t0_1)
               (+ from_2 r_t2t0_1))
        )
)
(assert (ite 
    (and (>= to_2 0) (<= to_2 payout_2))
    (and 
        (= l_t2t0_2 (- l_t2t0_1 payout_2))
        (= r_t2t0_2 (+ r_t2t0_1 from_2))
        (= a_t0_2 (- a_t0_1 from_2))
        (= a_t2_2 (+ a_t2_1 payout_2))
    )
    (and
        (= l_t2t0_2 l_t2t0_1 )
        (= r_t2t0_2 r_t2t0_1 )
        (= a_t0_2 a_t0_1 )
        (= a_t2_2 a_t2_1 )
    )
))

(assert (= 
            payout_3
            (/ 
               (* from_3 l_t0t1_2)
               (+ from_3 r_t0t1_2))
        )
)
(assert (ite 
    (and (>= to_3 0) (<= to_3 payout_3))
    (and 
        (= l_t0t1_3 (- l_t0t1_2 payout_3))
        (= r_t0t1_3 (+ r_t0t1_2 from_3))
        (= a_t0_3 (+ a_t0_2 payout_3))
        (= a_t1_3 (- a_t1_2 from_3))
    )
    (and
        (= l_t0t1_3 l_t0t1_2 )
        (= r_t0t1_3 r_t0t1_2 )
        (= a_t1_3 a_t1_2 )
        (= a_t0_3 a_t0_2 )
    )
))

; unchanged amms
(assert (= l_t2t0_1 l_t2t0_0))
(assert (= r_t2t0_1 r_t2t0_0))
(assert (= l_t0t1_1 l_t0t1_0))
(assert (= r_t0t1_1 r_t0t1_0))

(assert (= l_t1t2_2 l_t1t2_1))
(assert (= r_t1t2_2 r_t1t2_1))
(assert (= l_t0t1_2 l_t0t1_1))
(assert (= r_t0t1_2 r_t0t1_1))

(assert (= l_t2t0_3 l_t2t0_2))
(assert (= r_t2t0_3 r_t2t0_2))
(assert (= l_t1t2_3 l_t1t2_2))
(assert (= r_t1t2_3 r_t1t2_2))

; unchanged user wals
(assert (= a_t0_1 a_t0_0))
(assert (= a_t1_2 a_t1_1))
(assert (= a_t2_3 a_t2_2))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
