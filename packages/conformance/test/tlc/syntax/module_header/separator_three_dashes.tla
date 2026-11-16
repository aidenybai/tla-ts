(*---
description: Three dashes are not a separator; they lex as -- and -.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [module_header]
outcome: parse-error
---*)
---- MODULE separator_three_dashes ----
A == 1
---
B == 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "Beginning of definition" at line 10, column 1 and token "-" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 10, column 1.
    | ExtendableExpr starting at line 8, column 6.
    | Expression starting at line 8, column 6.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file separator_three_dashes
    | In module separator_three_dashes
    | Could not parse module separator_three_dashes from file separator_three_dashes.tla
    | *** Errors: 1
    | In module separator_three_dashes
    | Could not parse module separator_three_dashes from file separator_three_dashes.tla
    3002:1 Parsing or semantic analysis failed.
---*)
