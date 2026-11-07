(*---
description: An argument list cannot end in a comma.
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
outcome: parse-error
---*)
---- MODULE trailing_comma_argument ----
Op(x) == x
Test == Op(1,) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ")" at line 9, column 14 and token "," 
    | Residual stack trace follows:
    | Optional Arguments starting at line 9, column 11.
    | Primitive expression starting at line 9, column 9.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file trailing_comma_argument
    | In module trailing_comma_argument
    | Could not parse module trailing_comma_argument from file trailing_comma_argument.tla
    | *** Errors: 1
    | In module trailing_comma_argument
    | Could not parse module trailing_comma_argument from file trailing_comma_argument.tla
    3002:1 Parsing or semantic analysis failed.
---*)
