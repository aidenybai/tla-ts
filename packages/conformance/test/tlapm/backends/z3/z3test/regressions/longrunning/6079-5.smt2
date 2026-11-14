(*---
description: z3test's regression regressions/longrunning/6079-5.smt2.
ref: regressions/longrunning/6079-5.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)

(set-option :rewriter.elim_and true) ;; invalid model
;; (set-option :rewriter.flat false) ;; but this ok?

(declare-const a (_ FloatingPoint 11  53))
(declare-const b (_ FloatingPoint 11  53))
(assert (fp.eq (fp.max b a) (fp.fma RTN a b
(fp #b0 #b00000000000 #b0000000000000000000000000000000000000000000000000000))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
