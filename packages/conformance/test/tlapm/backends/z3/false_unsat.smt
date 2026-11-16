(*---
description: Z3 refutes false.
outcome: unsat
---*)
(set-logic UFNIA)
(assert false)
(check-sat)

(*--- recorded
all:
  exit: 0
  transcript: unsat
---*)
