(*---
description: "(1, 2) is not a tuple."
ref: "tla2sany/parser/TLAplusParser.java#ParenExpr"
features: [tuples]
outcome: parse-error
---*)
---- MODULE tuple_with_parens_comma ----
Test == (1, 2) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 8, column 11 and token "1" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file tuple_with_parens_comma
    | In module tuple_with_parens_comma
    | Could not parse module tuple_with_parens_comma from file tuple_with_parens_comma.tla
    | *** Errors: 1
    | In module tuple_with_parens_comma
    | Could not parse module tuple_with_parens_comma from file tuple_with_parens_comma.tla
    3002:1 Parsing or semantic analysis failed.
---*)
