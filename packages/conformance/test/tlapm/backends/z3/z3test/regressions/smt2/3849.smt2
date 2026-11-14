(*---
description: z3test's regression regressions/smt2/3849.smt2.
ref: regressions/smt2/3849.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :rewriter.push_ite_arith true)
(set-option :rewriter.eq2ineq true)
(set-option :fp.xform.elim_term_ite true)
(set-option :rewriter.arith_ineq_lhs true)
(assert
 (forall ((a Bool) (b Bool) (c Int) (d Int))
 (= d (ite (= a b) 0 (ite (= c 0) (+ c 1) c)))))
(check-sat-using horn)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
