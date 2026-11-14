(*---
description: z3test's regression regressions/smt2/2533.smt2.
ref: regressions/smt2/2533.smt2
features:
  - z3test
outcome: unsat
---*)
(declare-fun a () String) 
(declare-fun b () String) 
(declare-fun c () String)
(declare-fun d () String)
(declare-fun e () String)
(assert
  (not
    (=
      (str.replace
        (str.++ "A" (str.substr a 0 (str.len c)))
        "A"
        (str.substr b 0 (str.len d))
      )
      (str.replace (str.substr a 0 (str.len c)) "" d)
    )
  )
)
(assert (= b (str.++ d e)))
(check-sat)   
;(get-model)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
