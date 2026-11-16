(*---
description: 'The syntax corpus case "Negative Prefix Op on RHS of Infix (GH tlaplus/tlaplus #893)" in operators.txt, which tlapm''s parser tests read.'
ref: test/parser/syntax_corpus/operators.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893 ----
op == A & -B
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893.tla", line 11, character 7

    Operator "A" not found

    File "./operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893.tla", line 11, character 7:
    Error: Operator "A" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
