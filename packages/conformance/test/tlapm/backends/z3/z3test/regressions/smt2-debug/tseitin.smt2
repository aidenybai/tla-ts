(*---
description: z3test's regression regressions/smt2-debug/tseitin.smt2.
ref: regressions/smt2-debug/tseitin.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation
(declare-const p Bool)
(declare-const q Bool)
(declare-const r Bool)

(assert (or (and p q) (and q r)))

(apply tseitin-cnf-core)
(apply tseitin-cnf)
(apply (then tseitin-cnf propagate-values))

(reset)

(declare-const p Bool)
(declare-const x Int)

(assert (= x (if p 0 1)))

(apply tseitin-cnf-core)
(apply tseitin-cnf)

(reset)
(declare-const p Bool)
(declare-const q Bool)
(declare-const r Bool)

(push)
(assert (implies p q))
(apply tseitin-cnf-core)
(apply tseitin-cnf)
(pop)
(assert (xor p q))
(apply tseitin-cnf-core)
(apply tseitin-cnf)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "tactic failed: operator not supported, apply simplifier before invoking this strategy")
    (goals
    (goal
      (or p q)
      q
      (or p r)
      (or q r)
      :precision precise :depth 2)
    )
    (goals
    (goal
      q
      (or p r)
      :precision precise :depth 3)
    )
    (goals
    (goal
      (= x (ite p 0 1))
      :precision precise :depth 1)
    )
    (goals
    (goal
      (= x (ite p 0 1))
      :precision precise :depth 1)
    )
    (error "tactic failed: operator not supported, apply simplifier before invoking this strategy")
    (goals
    (goal
      (or q (not p))
      :precision precise :depth 2)
    )
    (error "tactic failed: operator not supported, apply simplifier before invoking this strategy")
    (goals
    (goal
      (or p (not q) (not k!0))
      (or q (not p) (not k!0))
      (or k!0 (not p) (not q))
      (or k!0 p q)
      (not k!0)
      :precision precise :depth 2)
    )
---*)
