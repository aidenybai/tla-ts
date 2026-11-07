(*---
description: z3test's regression regressions/smt2/issue-1729.smt2.
ref: regressions/smt2/issue-1729.smt2
features:
  - z3test
outcome: any
---*)
; GitHub issue

(assert (forall ((x (_ BitVec 4)))
                (forall ((y (_ BitVec 4)))
                        (= (bvadd x y) #x0))))

(apply (using-params bit-blast :blast-quant true))

(*--- recorded
all:
  exit: 0
  transcript: |-
    (goals
    (goal
      (forall ((x.0 Bool) (x.1 Bool) (x.2 Bool) (x.3 Bool))
        (forall ((y.0 Bool) (y.1 Bool) (y.2 Bool) (y.3 Bool))
          (let ((a!1 (= x.2 (= y.2 (or (not x.3) (not y.3)))))
                (a!2 (not (or (not x.2) (or (not x.3) (not y.3)))))
                (a!3 (not (or (not y.2) (or (not x.3) (not y.3))))))
          (let ((a!4 (or (not (or (not x.2) (not y.2))) a!2 a!3)))
          (let ((a!5 (or (not (or (not y.1) (not x.1)))
                         (not (or (not x.1) (not a!4)))
                         (not (or (not y.1) (not a!4))))))
            (not (or (not (= x.3 y.3))
                     (not a!1)
                     (= x.1 (= y.1 a!4))
                     (= x.0 (= y.0 a!5)))))))))
      :precision precise :depth 1)
    )
---*)
