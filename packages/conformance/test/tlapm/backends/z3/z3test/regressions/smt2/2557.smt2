(*---
description: z3test's regression regressions/smt2/2557.smt2.
ref: regressions/smt2/2557.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic NRA)
(assert
 (exists ((a Real))
  (forall ((b Real))
   (exists ((c Real))
    (and
     (< (+ a (* 2 c)) 0)
     (or (not (= a 0)) (< b 0))
     (not (= (+ b c) 0))
     (> c 0)
     )
    )
   )
  )
 )
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
