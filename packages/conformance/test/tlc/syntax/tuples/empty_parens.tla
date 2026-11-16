(*---
description: () is not an expression.
ref: "tla2sany/parser/TLAplusParser.java#ParenExpr"
features: [tuples]
outcome: parse-error
---*)
---- MODULE empty_parens ----
Test == () = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ")" at line 8, column 10 and token "(" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 10.
    | Expression starting at line 8, column 10.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file empty_parens
    | In module empty_parens
    | Could not parse module empty_parens from file empty_parens.tla
    | *** Errors: 1
    | In module empty_parens
    | Could not parse module empty_parens from file empty_parens.tla
    3002:1 Parsing or semantic analysis failed.
---*)
