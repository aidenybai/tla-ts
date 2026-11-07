(*---
description: z3test's regression regressions/smt2/5693.smt2.
ref: regressions/smt2/5693.smt2
features:
  - z3test
outcome: unsat
---*)
(assert (let ((a!1 (re.++ (str.to_re "a")
                  (re.* (re.++ (str.to_re "b") (str.to_re "a")))))
      (a!2 (re.++ (re.* (re.++ (str.to_re "a") (str.to_re "b")))
                  (str.to_re "a"))))
  (distinct (re.++ a!1 a!1) (re.++ a!2 a!2))))
(check-sat)
(reset)
(declare-const s String)
(assert (let ((a!1 (re.++ (str.to_re "a")
(re.* (re.++ (str.to_re "b") (str.to_re "a")))))
(a!2 (re.++ (re.* (re.++ (str.to_re "a") (str.to_re "b")))
(str.to_re "a"))))
(str.in.re s (re.diff (re.++ a!1 a!1) (re.++ a!2 a!2)))))
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
