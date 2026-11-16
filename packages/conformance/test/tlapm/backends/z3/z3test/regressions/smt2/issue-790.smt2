(*---
description: z3test's regression regressions/smt2/issue-790.smt2.
ref: regressions/smt2/issue-790.smt2
features:
  - z3test
outcome: sat
---*)
; Copyright (c) 2016 Microsoft Corporation

(declare-const $0 (_ BitVec 8))

(assert
(let ((a!1 (bvadd #x00000002 (concat ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          ((_ extract 7 7) $0)
                          $0))))
(bvsle (concat ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      ((_ extract 31 31) a!1)
                      a!1)
              #x000000007ffffffa)))

(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
