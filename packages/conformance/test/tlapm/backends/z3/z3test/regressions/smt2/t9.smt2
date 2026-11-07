(*---
description: z3test's regression regressions/smt2/t9.smt2.
ref: regressions/smt2/t9.smt2
features:
  - z3test
outcome: any
---*)

; Copyright (c) 2015 Microsoft Corporation


(get-assertions)

(set-option :interactive-mode true)

(declare-const a Bool)
(declare-const b Bool)

(assert (and a b))
(push)
(assert (or a (let ((x (or a b))) x)))
(push)
(assert (! (or a b) :named foo))
(get-assertions)
(pop)
(get-assertions)
(pop)
(get-assertions)
(pop)
(pop 1000)
(pop -1)
(push 10)
(pop 10)
exit
(exit)

(*--- recorded
all:
  exit: 0
  transcript: |-
    (error "line 5 column 15: command is only available in interactive mode, use command (set-option :interactive-mode true)")
    ((and a b)
     (or a (let ((x (or a b))) x))
     (! (or a b) :named foo))
    ((and a b)
     (or a (let ((x (or a b))) x)))
    ((and a b))
    (error "line 22 column 4: invalid pop command, argument is greater than the current stack depth")
    (error "line 23 column 9: invalid pop command, argument is greater than the current stack depth")
    (error "line 24 column 5: invalid push command, value is negative.")
    (error "line 27 column 0: invalid command, '(' expected")
---*)
