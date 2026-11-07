(*---
description: z3test's regression regressions/smt2/small-bv-quant-1.smt2.
ref: regressions/smt2/small-bv-quant-1.smt2
features:
  - z3test
outcome: any
---*)

(assert (forall ((u (_ BitVec 4)))
			(and
				(exists ((e1 (_ BitVec 4)) (e2 (_ BitVec 6)) (e3 (_ BitVec 6)))
					(and
						(= u e1)
						(= e2 e3)))
				(exists ((e22 (_ BitVec 4)))					
						(= u e22)))))

(apply simplify)
(apply (then (using-params elim-small-bv :max_bits 4) simplify))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      :precision precise :depth 1)
    )
    (goals
    (goal
      :precision precise :depth 2)
    )
---*)
