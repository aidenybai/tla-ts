(*---
description: z3test's regression regressions/smt2/qfbv-quant.smt2.
ref: regressions/smt2/qfbv-quant.smt2
features:
  - z3test
outcome: any
---*)
;; Variation of GitHub Issue #544; Nuno wants quantifiers in qfbv
(assert (forall ((X (_ BitVec 32)))
            (exists ((Y (_ BitVec 32)))
                (= X (bvmul Y Y)))))
(apply qfbv)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      false
      :precision precise :depth 8)
    )
---*)
