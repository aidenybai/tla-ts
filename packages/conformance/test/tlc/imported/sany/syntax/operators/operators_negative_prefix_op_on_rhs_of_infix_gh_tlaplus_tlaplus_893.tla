(*---
description: "Negative Prefix Op on RHS of Infix (GH tlaplus/tlaplus #893). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893 ----
op == A & -B
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops & in block line 9, col 9 to line 9, col 9 of module operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893
    | In module operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893
    | Could not parse module operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893 from file operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893.tla
    | *** Errors: 1
    | In module operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893
    | Could not parse module operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893 from file operators_negative_prefix_op_on_rhs_of_infix_gh_tlaplus_tlaplus_893.tla
    3002:1 Parsing or semantic analysis failed.
---*)
