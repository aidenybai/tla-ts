(*---
description: "/ is not associative, so a chain is a conflict even when user-defined."
ref: "tla2sany/parser/Operators.java#CanonicalOperators"
features: [operators]
outcome: parse-error
---*)
---- MODULE non_associative_slash_user ----
a / b == a
Test == 1 / 2 / 3 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops / in block line 9, col 11 to line 9, col 11 of module non_associative_slash_user and /.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 13.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file non_associative_slash_user
    | In module non_associative_slash_user
    | Could not parse module non_associative_slash_user from file non_associative_slash_user.tla
    | *** Errors: 1
    | In module non_associative_slash_user
    | Could not parse module non_associative_slash_user from file non_associative_slash_user.tla
    3002:1 Parsing or semantic analysis failed.
---*)
