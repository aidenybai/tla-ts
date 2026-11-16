(*---
description: z3test's regression regressions/smt2/fp-to_fp_simplifier.smt2.
ref: regressions/smt2/fp-to_fp_simplifier.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(set-logic QF_FP)

(simplify (( _ to_fp 11 53 ) roundNearestTiesToEven 1.0 0)) 

(simplify (( _ to_fp 8 24 ) roundNearestTiesToEven 1.0 0)) 

(simplify ((_ to_fp 11 53) roundNearestTiesToEven
			(( _ to_fp 8 24 ) roundNearestTiesToEven 1.0 0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (fp #b0 #b01111111111 #x0000000000000)
    (fp #b0 #x7f #b00000000000000000000000)
    (fp #b0 #b01111111111 #x0000000000000)
---*)
