(*---
description: z3test's regression regressions/smt2/mev_array.smt2.
ref: regressions/smt2/mev_array.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :produce-models true)

(declare-const a (Array Int Int))
(declare-const b (Array Int Int))
(declare-const c (Array Int Int))

(assert (let ( (base (store ((as const (Array Int Int)) 0) 42 15  )  ) )
          (and (= a base)
               (= b (store base 5 3))

               )
          ))
(check-sat)
;;(get-model)
(eval (= (store (store a 6 7) 5 8) (store (store b 6 7) 5 8)))
(eval (= (store (store (store a 5 2) 6 7) 5 3) (store b 6 7) ))
(eval (= (store a 6 7) (store (store b 6 7) 5 0)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    true
    true
    true
---*)
