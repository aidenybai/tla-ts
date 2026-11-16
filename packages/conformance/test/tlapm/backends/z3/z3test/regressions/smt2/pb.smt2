(*---
description: z3test's regression regressions/smt2/pb.smt2.
ref: regressions/smt2/pb.smt2
features:
  - z3test
outcome: sat
---*)
(set-logic QF_FD)

(declare-const a Bool)
(declare-const b Bool)
(declare-const c Bool)
(declare-const d Bool)

(push)
; a + b + c + d <= 2
(assert ((_ at-most 2) a b c d))
(check-sat)
(pop)

(push)
; a + b + c + d >= 3
(assert ((_ at-least 3) a b c d))
(check-sat)
(pop)


(push)
; 5 == 7*a + 3*b + 4*c + 3*d
(assert ((_ pbeq 5 7 3 4 3) a b c d))
(check-sat)
(pop)

(push)
; 5 >= 7*a + 3*b + 4*c + 3*d
(assert ((_ pbge 6 7 3 4 3) a b c d))
(check-sat)
(pop)

(push)
; 5 <= 7*a + 3*b + 4*c + 3*d
(assert ((_ pble 5 7 3 4 3) a b c d))
(check-sat)
(pop)

(reset)
(declare-const a Bool)
(declare-const b Bool)
(declare-const c Bool)
(declare-const d Bool)

(push)
; a + b + c + d <= 2
(assert ((_ at-most 2) a b c d))
(check-sat)
(pop)

(push)
; a + b + c + d >= 3
(assert ((_ at-least 3) a b c d))
(check-sat)
(pop)


(push)
; 5 == 7*a + 3*b + 4*c + 3*d
(assert ((_ pbeq 5 7 3 4 3) a b c d))
(check-sat)
(pop)

(push)
; 5 >= 7*a + 3*b + 4*c + 3*d
(assert ((_ pbge 5 7 3 4 3) a b c d))
(check-sat)
(pop)

(push)
; 5 <= 7*a + 3*b + 4*c + 3*d
(assert ((_ pble 5 7 3 4 3) a b c d))
(check-sat)
(pop)

(*--- recorded
all:
  exit: 0
  transcript: |-
    sat
    sat
    unsat
    sat
    sat
    sat
    sat
    unsat
    sat
    sat
---*)
