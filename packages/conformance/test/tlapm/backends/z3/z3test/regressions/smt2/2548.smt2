(*---
description: z3test's regression regressions/smt2/2548.smt2.
ref: regressions/smt2/2548.smt2
features:
  - z3test
outcome: unsat
---*)
(set-logic NRA)
(assert
    (forall
      ((b Real))
      (exists
        ((c Real))
        (and
          (< c 4)
          (not (= c (- 2)))
          (not (= c 0))
          (or
            (and
              (not
                (= (+ (* 8 b) (* 5 c)) 8)
              )
              (<
                (+ (* (- 80) b) (* (- 6) c))
                5
              )
            )
            (and
              (< (* (- 3) b) 1)
              (>= b 8)
            )
        )
      )
    )
  )
)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
