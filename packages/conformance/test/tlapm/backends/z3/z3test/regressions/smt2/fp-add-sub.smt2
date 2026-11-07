(*---
description: z3test's regression regressions/smt2/fp-add-sub.smt2.
ref: regressions/smt2/fp-add-sub.smt2
features:
  - z3test
outcome: sat
---*)

; Copyright (c) 2015 Microsoft Corporation 
(set-logic QF_FP) 
(set-info :status sat)

(declare-fun j () (_ FloatingPoint 3 5))
(declare-fun i () (_ FloatingPoint 3 5))

  (assert
    (not
      (or
        (not
          (fp.gt
            (fp.sub roundNearestTiesToEven
              i
              j
            )
            ((_ to_fp 3 5) roundNearestTiesToEven 0.0)
          )
        )
        (and
          (fp.leq
            (fp.sub roundNearestTiesToEven
              (fp.sub roundNearestTiesToEven
                (fp.add roundNearestTiesToEven
                  j
                  i
                )
                (fp.sub roundNearestTiesToEven
                  (fp.add roundNearestTiesToEven
                    j
                    i
                  )
                  j
                )
              )
              (fp.sub roundNearestTiesToEven
                (fp.add roundNearestTiesToEven
                  j
                  i
                )
                j
              )
            )
            ((_ to_fp 3 5) roundNearestTiesToEven 0.0)
          )
          true
        )
      )
    )
  )

(check-sat)
;;(check-sat-using (then simplify smt)) ;; CMW: Disabled, to slow.

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
