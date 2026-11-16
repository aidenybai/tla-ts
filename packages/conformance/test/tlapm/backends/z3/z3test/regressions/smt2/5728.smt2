(*---
description: z3test's regression regressions/smt2/5728.smt2.
ref: regressions/smt2/5728.smt2
features:
  - z3test
outcome: unsat
---*)
(set-option :encoding ascii)
(declare-const s String)
(assert (str.in_re s
(re.inter
(re.++ re.all (str.to_re "a")((_ re.loop 0 2) re.allchar) (str.to_re "b"))
(re.comp (re.++ re.all (str.to_re "b"))))))
(check-sat)

(reset)

(set-option :encoding unicode)
(declare-const s String)
(assert (str.in_re s
(re.inter
(re.++ re.all (str.to_re "a")((_ re.loop 0 3) (re.range "a" "k")) (re.range "m" "p"))
(re.comp (re.++ re.all (re.range "l" "q"))))))
(check-sat)

(reset)

(*--- recorded
all:
  exit: 0
  transcript: |-
    unsat
    unsat
---*)
