(*---
description: z3test's regression regressions/longrunning/6079-6.smt2.
ref: regressions/longrunning/6079-6.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :model_validate true)
(set-option :rewriter.flat false) ;; ok without

(declare-const a (_ FloatingPoint 11  53))
(declare-const b (_ FloatingPoint 11  53))
(assert (fp.eq (fp.max b b) (fp.fma RTZ b b b)))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
