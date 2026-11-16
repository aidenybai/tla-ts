(*---
description: "UNCHANGED and prime have a precedence conflict, so UNCHANGED v' is a parse error before any level check."
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE unchanged_prime_precedence ----
VARIABLE v
A == UNCHANGED v'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Precedence conflict between ops UNCHANGED in block line 9, col 17 to line 9, col 17 of module unchanged_prime_precedence and '.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 16.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file unchanged_prime_precedence
    | In module unchanged_prime_precedence
    | Could not parse module unchanged_prime_precedence from file unchanged_prime_precedence.tla
    | *** Errors: 1
    | In module unchanged_prime_precedence
    | Could not parse module unchanged_prime_precedence from file unchanged_prime_precedence.tla
    3002:1 Parsing or semantic analysis failed.
---*)
