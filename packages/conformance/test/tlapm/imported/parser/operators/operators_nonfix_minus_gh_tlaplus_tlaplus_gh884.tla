(*---
description: 'The syntax corpus case "Nonfix Minus (GH tlaplus/tlaplus #GH884)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_nonfix_minus_gh_tlaplus_tlaplus_gh884 ----
op == - (1,2)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_nonfix_minus_gh_tlaplus_tlaplus_gh884.tla", line 11, characters 7-12

    Operator "-" not found

    File "./operators_nonfix_minus_gh_tlaplus_tlaplus_gh884.tla", line 11, characters 7-12:
    Error: Operator "-" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
