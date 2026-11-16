(*---
description: z3test's regression regressions/smt2/loop.smt2.
ref: regressions/smt2/loop.smt2
features:
  - z3test
outcome: any
---*)
(declare-const a (RegEx String))

(simplify (re.loop a 1 1))
(simplify (re.loop a 0 0))
(simplify (re.loop a 3 2))
(simplify (re.loop (re.loop a 1 2) 2 3))
(simplify (re.loop (re.loop a 3 5) 3))
(simplify (re.loop (re.loop a 3) 3 4))
(simplify (re.++ (re.loop a 1 2) (re.loop a 2 3)))
(simplify (re.++ (re.loop a 1 2) (re.loop a 2)))
(simplify (re.++ (re.loop a 1) (re.loop a 2 3)))
(simplify (re.++ (re.loop a 1) (re.loop a 2 3)))
(simplify (re.loop a 0))
(simplify (re.++ (re.* a) (re.loop a 1 2)))
(simplify (re.++ (re.loop a 1 2) (re.* a)))

(*--- recorded
all:
  exit: 0
  transcript: |-
    a
    (str.to_re "")
    re.none
    ((_ re.loop 2 3) ((_ re.loop 1 2) a))
    ((_ re.loop 3) ((_ re.loop 3 5) a))
    ((_ re.loop 3 4) ((_ re.loop 3) a))
    ((_ re.loop 3 5) a)
    ((_ re.loop 3) a)
    ((_ re.loop 3) a)
    ((_ re.loop 3) a)
    (re.* a)
    ((_ re.loop 1) a)
    ((_ re.loop 1) a)
---*)
