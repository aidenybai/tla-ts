(*---
description: A parameter list cannot end in a comma.
ref: "tla2sany/parser/TLAplusParser.java#IdentLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE trailing_comma_parameter ----
Op(x,) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier Declaration, prefix op or _"
    | Encountered ")" at line 8, column 6 and token "," 
    | Residual stack trace follows:
    | Identifier LHS starting at line 8, column 1.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file trailing_comma_parameter
    | In module trailing_comma_parameter
    | Could not parse module trailing_comma_parameter from file trailing_comma_parameter.tla
    | *** Errors: 1
    | In module trailing_comma_parameter
    | Could not parse module trailing_comma_parameter from file trailing_comma_parameter.tla
    3002:1 Parsing or semantic analysis failed.
---*)
