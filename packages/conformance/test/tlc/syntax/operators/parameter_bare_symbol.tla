(*---
description: A bare operator symbol is not a parameter form.
ref: "tla2sany/parser/TLAplusParser.java#SomeFixDecl"
features: [operators]
outcome: parse-error
---*)
---- MODULE parameter_bare_symbol ----
Op(++) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier Declaration, prefix op, _ or )"
    | Encountered "++" at line 8, column 4 and token "(" 
    | Residual stack trace follows:
    | Identifier LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file parameter_bare_symbol
    | In module parameter_bare_symbol
    | Could not parse module parameter_bare_symbol from file parameter_bare_symbol.tla
    | *** Errors: 1
    | In module parameter_bare_symbol
    | Could not parse module parameter_bare_symbol from file parameter_bare_symbol.tla
    3002:1 Parsing or semantic analysis failed.
---*)
