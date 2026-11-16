(*---
description: "SUBSET is a prefix keyword, so SUBSET(1, 2) is a parse error at the comma."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE arity_builtin_nonfix_subset ----
A == SUBSET(1, 2)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 8, column 14 and token "1" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 12.
    | Expression starting at line 8, column 6.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file arity_builtin_nonfix_subset
    | In module arity_builtin_nonfix_subset
    | Could not parse module arity_builtin_nonfix_subset from file arity_builtin_nonfix_subset.tla
    | *** Errors: 1
    | In module arity_builtin_nonfix_subset
    | Could not parse module arity_builtin_nonfix_subset from file arity_builtin_nonfix_subset.tla
    3002:1 Parsing or semantic analysis failed.
---*)
